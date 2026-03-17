from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from auth import get_current_user, get_optional_user
import models

router = APIRouter(prefix="/api/reels", tags=["Reels"])


class ReelAnalyticsRequest(BaseModel):
    action: str = Field(..., min_length=1)
    watch_time: float = 0


def _as_dict(media: models.PostMedia, view_count: int, like_count: int, share_count: int, user_liked: bool):
    post = media.post
    author = None
    if post and not post.is_anonymous and post.author:
        author = {
            "id": post.author.id,
            "student_id": post.author.student_id,
            "display_name": post.author.display_name
        }
    return {
        "media_id": media.id,
        "post_id": media.post_id,
        "file_url": media.file_url,
        "mime_type": media.mime_type,
        "file_name": media.file_name,
        "created_at": media.created_at,
        "view_count": int(view_count or 0),
        "like_count": int(like_count or 0),
        "share_count": int(share_count or 0),
        "user_liked": user_liked,
        "author": author
    }


@router.get("/daily")
def get_daily_reels(
    date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 12,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_optional_user)
):
    target_date = datetime.utcnow().date()
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ")

    view_subq = db.query(func.count(models.ReelView.id)).filter(
        models.ReelView.media_id == models.PostMedia.id
    ).correlate(models.PostMedia).scalar_subquery()
    like_subq = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == models.PostMedia.id,
        models.ReelInteraction.interaction_type == "like"
    ).correlate(models.PostMedia).scalar_subquery()
    share_subq = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == models.PostMedia.id,
        models.ReelInteraction.interaction_type == "share"
    ).correlate(models.PostMedia).scalar_subquery()

    query = db.query(
        models.PostMedia,
        view_subq.label("view_count"),
        like_subq.label("like_count"),
        share_subq.label("share_count")
    ).join(models.Post, models.Post.id == models.PostMedia.post_id).options(
        joinedload(models.PostMedia.post).joinedload(models.Post.author)
    ).filter(
        models.PostMedia.media_type == "video",
        func.date(models.PostMedia.created_at) == target_date
    ).order_by(models.PostMedia.created_at.desc())

    if current_user:
        user_liked_subq = db.query(models.ReelInteraction.id).filter(
            models.ReelInteraction.media_id == models.PostMedia.id,
            models.ReelInteraction.user_id == current_user.id,
            models.ReelInteraction.interaction_type == "like"
        ).correlate(models.PostMedia).exists()
        query = query.add_columns(user_liked_subq.label("user_liked"))

    rows = query.offset(skip).limit(limit).all()
    items = []
    for row in rows:
        if current_user:
            media, view_count, like_count, share_count, user_liked = row
        else:
            media, view_count, like_count, share_count = row
            user_liked = False
        items.append(_as_dict(media, view_count, like_count, share_count, user_liked))
    return {
        "success": True,
        "data": {
            "date": str(target_date),
            "items": items,
            "skip": skip,
            "limit": limit,
            "has_more": len(items) == limit
        }
    }


@router.post("/{media_id}/view")
def track_view(
    media_id: int,
    watch_time: float = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_optional_user)
):
    media = db.query(models.PostMedia).filter(models.PostMedia.id == media_id, models.PostMedia.media_type == "video").first()
    if not media:
        raise HTTPException(status_code=404, detail="Không tìm thấy reel")

    view = models.ReelView(
        media_id=media_id,
        user_id=current_user.id if current_user else None,
        watch_time=max(0, watch_time)
    )
    db.add(view)
    db.commit()
    total_views = db.query(func.count(models.ReelView.id)).filter(models.ReelView.media_id == media_id).scalar() or 0
    return {"success": True, "data": {"media_id": media_id, "view_count": int(total_views)}}


@router.post("/{media_id}/analytics")
def track_analytics(
    media_id: int,
    payload: ReelAnalyticsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    media = db.query(models.PostMedia).filter(models.PostMedia.id == media_id, models.PostMedia.media_type == "video").first()
    if not media:
        raise HTTPException(status_code=404, detail="Không tìm thấy reel")

    action = payload.action.strip().lower()
    if action not in {"like", "share", "watch"}:
        raise HTTPException(status_code=400, detail="Hành động không hợp lệ")

    if action == "like":
        existing = db.query(models.ReelInteraction).filter(
            models.ReelInteraction.media_id == media_id,
            models.ReelInteraction.user_id == current_user.id,
            models.ReelInteraction.interaction_type == "like"
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            likes = db.query(func.count(models.ReelInteraction.id)).filter(
                models.ReelInteraction.media_id == media_id,
                models.ReelInteraction.interaction_type == "like"
            ).scalar() or 0
            return {"success": True, "data": {"status": "unliked", "like_count": int(likes)}}

    interaction = models.ReelInteraction(
        media_id=media_id,
        user_id=current_user.id,
        interaction_type="watch" if action == "watch" else action,
        watch_time=max(0, payload.watch_time)
    )
    db.add(interaction)
    db.commit()
    likes = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == media_id,
        models.ReelInteraction.interaction_type == "like"
    ).scalar() or 0
    shares = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == media_id,
        models.ReelInteraction.interaction_type == "share"
    ).scalar() or 0
    return {"success": True, "data": {"status": action, "like_count": int(likes), "share_count": int(shares)}}
