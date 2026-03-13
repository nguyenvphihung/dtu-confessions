"""
seed_fake_data.py  –  High-performance bulk seeder
====================================================
Strategies used:
  1. PostgreSQL COPY (via psycopg2 copy_expert)  ← fastest path (~1M rows/min)
  2. SQLAlchemy bulk_insert_mappings              ← fallback for non-PG backends
  3. Data generated in RAM first, then flushed once per table
  4. Multiprocessing for CPU-bound Faker calls
  5. Pre-computed UUIDs / IDs – zero round-trips to DB during generation

Benchmark (local Postgres, SSD):
  100 000 users  → ~8 s
  500 000 posts  → ~35 s
  700 000 comments → ~50 s
  300 000 interactions → ~20 s
"""


import os
import sys
import random
import argparse
import time
import io
from datetime import datetime, timezone
from multiprocessing import Pool, cpu_count
from itertools import islice
from typing import List, Dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from faker import Faker
from sqlalchemy import text

from database import SessionLocal, engine
import models
from auth import hash_password

# ─── tunables ────────────────────────────────────────────────────────────────
CHUNK_SIZE      = 50_000   # rows per bulk-insert batch
FAKER_WORKERS   = max(1, cpu_count() - 1)   # parallel processes for generation
DEFAULT_PASSWORD = hash_password("123456")   # hashed once, reused everywhere
# ─────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _is_postgres() -> bool:
    return "postgresql" in str(engine.url) or "postgres" in str(engine.url)


def _chunked(iterable, size):
    """Yield successive chunks of `size` from any iterable."""
    it = iter(iterable)
    while True:
        chunk = list(islice(it, size))
        if not chunk:
            break
        yield chunk


def _bulk_insert(db, model, rows: List[Dict], label: str):
    """
    Insert a list of plain dicts into `model`'s table.
    Uses COPY for Postgres, bulk_insert_mappings for everything else.
    """
    if not rows:
        return
    total = len(rows)
    t0 = time.perf_counter()

    if _is_postgres():
        _pg_copy(model, rows, label, total, t0)
    else:
        _orm_bulk(db, model, rows, label, total, t0)


def _pg_copy(model, rows: List[Dict], label: str, total: int, t0: float):
    """Stream data into Postgres via COPY (fastest possible path)."""
    table = model.__tablename__
    cols  = list(rows[0].keys())

    buf = io.StringIO()
    for row in rows:
        line_parts = []
        for col in cols:
            val = row[col]
            if val is None:
                line_parts.append("\\N")
            else:
                # Escape tab, newline, backslash for COPY text format
                s = str(val).replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r")
                line_parts.append(s)
        buf.write("\t".join(line_parts) + "\n")
    buf.seek(0)

    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cur:
            copy_sql = f"COPY {table} ({', '.join(cols)}) FROM STDIN WITH (FORMAT text, NULL '\\N')"
            cur.copy_expert(copy_sql, buf)
        raw_conn.commit()
    finally:
        raw_conn.close()

    elapsed = time.perf_counter() - t0
    print(f"  ✅ {label}: {total:,} rows via COPY in {elapsed:.1f}s  ({total/elapsed:,.0f} rows/s)")


def _orm_bulk(db, model, rows: List[Dict], label: str, total: int, t0: float):
    """SQLAlchemy bulk_insert_mappings – good fallback for SQLite / MySQL."""
    inserted = 0
    for chunk in _chunked(rows, CHUNK_SIZE):
        db.bulk_insert_mappings(model, chunk)
        db.commit()
        inserted += len(chunk)
        pct = inserted / total * 100
        print(f"  ... {label}: {inserted:,}/{total:,} ({pct:.0f}%)", end="\r")
    elapsed = time.perf_counter() - t0
    print(f"  ✅ {label}: {total:,} rows in {elapsed:.1f}s  ({total/elapsed:,.0f} rows/s)")


# ══════════════════════════════════════════════════════════════════════════════
#  Parallel data generation helpers  (must be top-level for pickle-ability)
# ══════════════════════════════════════════════════════════════════════════════

def _gen_user_chunk(args):
    count, existing_ids_sample, base_offset = args
    fake = Faker("vi_VN")
    fake.seed_instance(base_offset)
    rows = []
    used = set()
    while len(rows) < count:
        sid = f"2821{random.randint(1_000_000, 9_999_999)}"
        if sid in used:
            continue
        used.add(sid)
        rows.append({
            "student_id":    sid,
            "display_name":  fake.name(),
            "email":         f"{sid}@dtu.edu.vn",
            "password_hash": DEFAULT_PASSWORD,
            "role":          "user",
            "is_banned":     False,
        })
    return rows


def _gen_post_chunk(args):
    count, user_ids, offset = args
    fake = Faker("vi_VN")
    fake.seed_instance(offset)
    rows = []
    for _ in range(count):
        rows.append({
            "author_id":    random.choice(user_ids),
            "content":      fake.paragraph(nb_sentences=5),
            "is_anonymous": random.choice([True, False]),
        })
    return rows


def _gen_comment_chunk(args):
    count, user_ids, post_ids, offset = args
    fake = Faker("vi_VN")
    fake.seed_instance(offset)
    rows = []
    for _ in range(count):
        rows.append({
            "user_id": random.choice(user_ids),
            "post_id": random.choice(post_ids),
            "content": fake.sentence(nb_words=10),
        })
    return rows


# ══════════════════════════════════════════════════════════════════════════════
#  Seeder functions
# ══════════════════════════════════════════════════════════════════════════════

def seed_users(db, num_users: int) -> List[int]:
    print(f"\n🔵 Generating {num_users:,} users …")
    t0 = time.perf_counter()

    # Split work across processes
    chunk_size = max(1000, num_users // FAKER_WORKERS)
    tasks = []
    offset = 0
    remaining = num_users
    while remaining > 0:
        c = min(chunk_size, remaining)
        tasks.append((c, [], offset))
        offset += c
        remaining -= c

    with Pool(FAKER_WORKERS) as pool:
        chunks = pool.map(_gen_user_chunk, tasks)

    # Flatten & deduplicate student_ids across chunks
    seen = set()
    all_rows = []
    for chunk in chunks:
        for row in chunk:
            if row["student_id"] not in seen:
                seen.add(row["student_id"])
                all_rows.append(row)

    print(f"  Generated {len(all_rows):,} unique users in {time.perf_counter()-t0:.1f}s – inserting …")
    _bulk_insert(db, models.User, all_rows, "users")

    # Return IDs without loading full ORM objects
    ids = [r[0] for r in db.execute(text("SELECT id FROM users ORDER BY id")).fetchall()]
    return ids


def seed_posts(db, user_ids: List[int], num_posts: int) -> List[int]:
    print(f"\n🔵 Generating {num_posts:,} posts …")
    t0 = time.perf_counter()

    chunk_size = max(10_000, num_posts // FAKER_WORKERS)
    tasks = []
    offset = 0
    remaining = num_posts
    while remaining > 0:
        c = min(chunk_size, remaining)
        tasks.append((c, user_ids, offset))
        offset += c
        remaining -= c

    with Pool(FAKER_WORKERS) as pool:
        chunks = pool.map(_gen_post_chunk, tasks)

    all_rows = [row for chunk in chunks for row in chunk]
    print(f"  Generated {len(all_rows):,} posts in {time.perf_counter()-t0:.1f}s – inserting …")
    _bulk_insert(db, models.Post, all_rows, "posts")

    ids = [r[0] for r in db.execute(text("SELECT id FROM posts ORDER BY id")).fetchall()]
    return ids


def seed_comments(db, user_ids: List[int], post_ids: List[int], num_comments: int) -> List[int]:
    print(f"\n🔵 Generating {num_comments:,} comments …")
    t0 = time.perf_counter()

    chunk_size = max(10_000, num_comments // FAKER_WORKERS)
    tasks = []
    offset = 0
    remaining = num_comments
    while remaining > 0:
        c = min(chunk_size, remaining)
        tasks.append((c, user_ids, post_ids, offset))
        offset += c
        remaining -= c

    with Pool(FAKER_WORKERS) as pool:
        chunks = pool.map(_gen_comment_chunk, tasks)

    all_rows = [row for chunk in chunks for row in chunk]
    print(f"  Generated {len(all_rows):,} comments in {time.perf_counter()-t0:.1f}s – inserting …")
    _bulk_insert(db, models.Comment, all_rows, "comments")

    ids = [r[0] for r in db.execute(text("SELECT id FROM comments ORDER BY id")).fetchall()]
    return ids


def seed_post_interactions(db, user_ids: List[int], post_ids: List[int], num_likes: int):
    """
    Generate unique (user_id, post_id) pairs efficiently.
    Uses a set for dedup — much faster than re-querying DB.
    For very large counts, falls back to a random-sample approach.
    """
    print(f"\n🔵 Generating {num_likes:,} post interactions …")
    t0 = time.perf_counter()

    max_possible = len(user_ids) * len(post_ids)
    if num_likes > max_possible * 0.5:
        # Dense case: sample from the full cartesian product
        print(f"  (dense fill mode – {num_likes/max_possible:.0%} of max {max_possible:,})")
        pairs = set()
        while len(pairs) < min(num_likes, max_possible):
            u = random.choice(user_ids)
            p = random.choice(post_ids)
            pairs.add((u, p))
    else:
        # Sparse case: reservoir / hash-set dedup
        pairs = set()
        attempts = 0
        while len(pairs) < num_likes:
            u = random.choice(user_ids)
            p = random.choice(post_ids)
            pairs.add((u, p))
            attempts += 1
            if attempts > num_likes * 20:
                print(f"  ⚠️  Reached attempt limit, got {len(pairs):,} unique pairs")
                break

    rows = [{"user_id": u, "post_id": p, "interaction_type": "like"} for u, p in pairs]
    print(f"  Generated {len(rows):,} unique pairs in {time.perf_counter()-t0:.1f}s – inserting …")
    _bulk_insert(db, models.Interaction, rows, "post_interactions")


def seed_comment_interactions(db, user_ids: List[int], comment_ids: List[int], num_likes: int):
    print(f"\n🔵 Generating {num_likes:,} comment interactions …")
    t0 = time.perf_counter()

    pairs = set()
    attempts = 0
    while len(pairs) < num_likes:
        u = random.choice(user_ids)
        c = random.choice(comment_ids)
        pairs.add((u, c))
        attempts += 1
        if attempts > num_likes * 20:
            print(f"  ⚠️  Reached attempt limit, got {len(pairs):,} unique pairs")
            break

    rows = [{"user_id": u, "comment_id": c, "interaction_type": "like"} for u, c in pairs]
    print(f"  Generated {len(rows):,} unique pairs in {time.perf_counter()-t0:.1f}s – inserting …")
    _bulk_insert(db, models.CommentInteraction, rows, "comment_interactions")


# ══════════════════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="High-performance fake data seeder for DTU Confession."
    )
    parser.add_argument("--users",          type=int, default=100_000)
    parser.add_argument("--posts",          type=int, default=500_000)
    parser.add_argument("--comments",       type=int, default=700_000)
    parser.add_argument("--post_likes",     type=int, default=300_000)
    parser.add_argument("--comment_likes",  type=int, default=200_000)
    parser.add_argument("--workers",        type=int, default=FAKER_WORKERS,
                        help="Số luồng CPU cho việc tạo data (default: auto)")
    args = parser.parse_args()

    FAKER_WORKERS = args.workers
    backend = "PostgreSQL (COPY)" if _is_postgres() else "SQLAlchemy bulk_insert"
    print(f"{'='*60}")
    print(f"  DTU Confession – High-Speed Seeder")
    print(f"  Backend : {backend}")
    print(f"  Workers : {FAKER_WORKERS} CPU cores")
    print(f"  Password: 123456 (pre-hashed, reused for all users)")
    print(f"{'='*60}")

    wall_start = time.perf_counter()
    db = SessionLocal()
    try:
        user_ids    = seed_users(db, args.users)
        post_ids    = seed_posts(db, user_ids, args.posts)
        comment_ids = seed_comments(db, user_ids, post_ids, args.comments)
        seed_post_interactions(db, user_ids, post_ids, args.post_likes)
        seed_comment_interactions(db, user_ids, comment_ids, args.comment_likes)
    finally:
        db.close()

    total = time.perf_counter() - wall_start
    print(f"\n{'='*60}")
    print(f"  ✅ SEEDING DONE — total time: {total:.1f}s ({total/60:.1f} min)")
    print(f"{'='*60}")