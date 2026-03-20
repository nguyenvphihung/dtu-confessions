"""add moderation, reports, notifications

Revision ID: 20260320_0001
Revises: f660ed3b5678
Create Date: 2026-03-20 08:50:00
"""
from alembic import op
import sqlalchemy as sa

revision = "20260320_0001"
down_revision = "f660ed3b5678"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Post moderation columns ---
    op.add_column("posts", sa.Column("status", sa.String(20), nullable=True))
    op.add_column("posts", sa.Column("confession_number", sa.Integer(), nullable=True))
    op.add_column("posts", sa.Column("rejected_reason", sa.String(500), nullable=True))

    # Backfill: all existing posts become approved
    op.execute("UPDATE posts SET status = 'approved' WHERE status IS NULL")

    # Backfill: assign confession_number to existing approved posts by created_at order
    op.execute("""
        UPDATE posts SET confession_number = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
            FROM posts
            WHERE status = 'approved'
        ) sub
        WHERE posts.id = sub.id
    """)

    # Now make status NOT NULL
    op.alter_column("posts", "status", nullable=False, server_default="pending")

    op.create_index("ix_posts_status", "posts", ["status"])
    op.create_unique_constraint("uq_posts_confession_number", "posts", ["confession_number"])

    # --- Reports table ---
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("reporter_id", sa.Integer(), nullable=False),
        sa.Column("target_type", sa.String(20), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]),
        sa.UniqueConstraint("reporter_id", "target_type", "target_id", name="uq_user_report_target"),
    )
    op.create_index("ix_reports_id", "reports", ["id"])
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"])
    op.create_index("ix_reports_status", "reports", ["status"])

    # --- Notifications table ---
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("ref_type", sa.String(20), nullable=True),
        sa.Column("ref_id", sa.Integer(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_notifications_id", "notifications", ["id"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("reports")

    op.drop_constraint("uq_posts_confession_number", "posts", type_="unique")
    op.drop_index("ix_posts_status", table_name="posts")
    op.drop_column("posts", "rejected_reason")
    op.drop_column("posts", "confession_number")
    op.drop_column("posts", "status")
