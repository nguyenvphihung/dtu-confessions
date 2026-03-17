from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import models
from database import get_db
from auth import get_current_user, get_optional_user
from routers import comments_router, reels_router


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
models.Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_user_and_post():
    db = TestingSessionLocal()
    user = models.User(
        student_id="SEED001",
        display_name="Seed User",
        email="seed@example.com",
        password_hash="hashed"
    )
    db.add(user)
    db.flush()
    post = models.Post(author_id=user.id, content="post", is_anonymous=False)
    db.add(post)
    db.flush()
    media = models.PostMedia(
        post_id=post.id,
        file_url="/api/media/files/v.mp4",
        file_name="v.mp4",
        file_size=123,
        media_type="video",
        mime_type="video/mp4"
    )
    db.add(media)
    db.commit()
    db.refresh(user)
    db.refresh(post)
    db.refresh(media)
    db.close()
    return user, post, media


seed_user, seed_post, seed_media = seed_user_and_post()


def override_current_user():
    return seed_user


def override_optional_user():
    return seed_user


app = FastAPI()
app.include_router(comments_router.router)
app.include_router(reels_router.router)
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_current_user
app.dependency_overrides[get_optional_user] = override_optional_user
client = TestClient(app)


def test_comment_created_from_reel_is_visible_in_post():
    create_res = client.post(
        f"/api/reels/{seed_media.id}/comments",
        json={"content": "hello from reel", "parent_id": None}
    )
    assert create_res.status_code == 201
    post_res = client.get(f"/api/posts/{seed_post.id}/comments")
    assert post_res.status_code == 200
    assert any(item["content"] == "hello from reel" for item in post_res.json())


def test_comment_created_from_post_is_visible_in_reel():
    create_res = client.post(
        f"/api/posts/{seed_post.id}/comments",
        json={"content": "hello from post", "parent_id": None}
    )
    assert create_res.status_code == 201
    reel_res = client.get(f"/api/reels/{seed_media.id}/comments")
    assert reel_res.status_code == 200
    assert any(item["content"] == "hello from post" for item in reel_res.json())
