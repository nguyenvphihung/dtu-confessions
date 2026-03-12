from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from database import get_db
import models

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/")
def get_stats(db: Session = Depends(get_db)):
    total_posts = db.query(func.count(models.Post.id)).scalar() or 0
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_comments = db.query(func.count(models.Comment.id)).scalar() or 0

    # Posts today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    posts_today = db.query(func.count(models.Post.id)).filter(
        models.Post.created_at >= today_start
    ).scalar() or 0

    return {
        "total_posts": total_posts,
        "total_users": total_users,
        "total_comments": total_comments,
        "posts_today": posts_today,
    }


@router.get("/top-posts")
def get_top_posts(db: Session = Depends(get_db)):
    """Top 5 most liked posts in the last 7 days."""
    week_ago = datetime.utcnow() - timedelta(days=7)

    results = (
        db.query(
            models.Post.id,
            models.Post.content,
            models.Post.is_anonymous,
            models.Post.author_id,
            models.Post.created_at,
            func.count(models.Interaction.id).label("like_count"),
        )
        .outerjoin(models.Interaction, models.Interaction.post_id == models.Post.id)
        .filter(models.Post.created_at >= week_ago)
        .group_by(models.Post.id)
        .order_by(desc("like_count"), desc(models.Post.created_at))
        .limit(5)
        .all()
    )

    posts = []
    for r in results:
        author = None
        if not r.is_anonymous:
            user = db.query(models.User).filter(models.User.id == r.author_id).first()
            if user:
                author = {"display_name": user.display_name, "student_id": user.student_id}

        comment_count = db.query(func.count(models.Comment.id)).filter(
            models.Comment.post_id == r.id
        ).scalar() or 0

        posts.append({
            "id": r.id,
            "content": r.content[:100],
            "is_anonymous": r.is_anonymous,
            "like_count": r.like_count,
            "comment_count": comment_count,
            "created_at": r.created_at,
            "author": author,
        })

    return posts


@router.get("/active-users")
def get_active_users(db: Session = Depends(get_db)):
    """Top 5 users with most posts."""
    results = (
        db.query(
            models.User.id,
            models.User.display_name,
            models.User.student_id,
            func.count(models.Post.id).label("post_count"),
        )
        .join(models.Post, models.Post.author_id == models.User.id)
        .filter(models.User.is_banned == False)
        .group_by(models.User.id)
        .order_by(desc("post_count"))
        .limit(5)
        .all()
    )

    return [
        {
            "id": r.id,
            "display_name": r.display_name,
            "student_id": r.student_id,
            "post_count": r.post_count,
        }
        for r in results
    ]
