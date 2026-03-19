from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from auth import get_current_user, get_optional_user
import models
from schemas import CommentCreate, CommentResponse
from services.comment_service import create_comment_for_post, get_comments_for_post
import os
import shutil
import subprocess

router = APIRouter(prefix="/api/reels", tags=["Reels"])
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
THUMB_DIR = os.path.join(UPLOADS_DIR, "thumbnails")
os.makedirs(THUMB_DIR, exist_ok=True)
SUPPORTED_VIDEO_MIME = {"video/mp4", "video/webm", "video/quicktime", "video/x-matroska"}


class ReelAnalyticsRequest(BaseModel):
    action: str = Field(..., min_length=1)
    watch_time: float = 0


def _as_dict(media: models.PostMedia, view_count: int, like_count: int, share_count: int, comment_count: int, user_liked: bool):
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
        "thumbnail_url": f"/api/reels/{media.id}/thumbnail",
        "view_count": int(view_count or 0),
        "like_count": int(like_count or 0),
        "share_count": int(share_count or 0),
        "comment_count": int(comment_count or 0),
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
    like_subq = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == models.PostMedia.post_id,
        models.Interaction.interaction_type == "like"
    ).correlate(models.PostMedia).scalar_subquery()
    share_subq = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == models.PostMedia.id,
        models.ReelInteraction.interaction_type == "share"
    ).correlate(models.PostMedia).scalar_subquery()
    comment_subq = db.query(func.count(models.Comment.id)).filter(
        models.Comment.post_id == models.PostMedia.post_id
    ).correlate(models.PostMedia).scalar_subquery()

    query = db.query(
        models.PostMedia,
        view_subq.label("view_count"),
        like_subq.label("like_count"),
        share_subq.label("share_count"),
        comment_subq.label("comment_count")
    ).join(models.Post, models.Post.id == models.PostMedia.post_id).options(
        joinedload(models.PostMedia.post).joinedload(models.Post.author)
    ).filter(
        models.PostMedia.media_type == "video",
        func.date(models.PostMedia.created_at) == target_date
    ).order_by(models.PostMedia.created_at.desc())

    if current_user:
        user_liked_subq = db.query(models.Interaction.id).filter(
            models.Interaction.post_id == models.PostMedia.post_id,
            models.Interaction.user_id == current_user.id,
            models.Interaction.interaction_type == "like"
        ).correlate(models.PostMedia).exists()
        query = query.add_columns(user_liked_subq.label("user_liked"))

    rows = query.offset(skip).limit(limit).all()
    items = []
    for row in rows:
        if current_user:
            media, view_count, like_count, share_count, comment_count, user_liked = row
        else:
            media, view_count, like_count, share_count, comment_count = row
            user_liked = False
        items.append(_as_dict(media, view_count, like_count, share_count, comment_count, user_liked))
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
        existing = db.query(models.Interaction).filter(
            models.Interaction.post_id == media.post_id,
            models.Interaction.user_id == current_user.id,
            models.Interaction.interaction_type == "like"
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            likes = db.query(func.count(models.Interaction.id)).filter(
                models.Interaction.post_id == media.post_id,
                models.Interaction.interaction_type == "like"
            ).scalar() or 0
            return {"success": True, "data": {"status": "unliked", "like_count": int(likes)}}
        interaction = models.Interaction(
            user_id=current_user.id,
            post_id=media.post_id,
            interaction_type="like"
        )
        db.add(interaction)
        db.commit()
        likes = db.query(func.count(models.Interaction.id)).filter(
            models.Interaction.post_id == media.post_id,
            models.Interaction.interaction_type == "like"
        ).scalar() or 0
        shares = db.query(func.count(models.ReelInteraction.id)).filter(
            models.ReelInteraction.media_id == media_id,
            models.ReelInteraction.interaction_type == "share"
        ).scalar() or 0
        return {"success": True, "data": {"status": "like", "like_count": int(likes), "share_count": int(shares)}}

    # For reel interactions, avoid inserting duplicate rows for the same (user,media,action).
    # - For 'watch' actions: accumulate watch_time on existing record if present.
    # - For 'share' actions: create once per user/media (no duplicates).
    itype = "watch" if action == "watch" else action
    existing = db.query(models.ReelInteraction).filter(
        models.ReelInteraction.media_id == media_id,
        models.ReelInteraction.user_id == current_user.id,
        models.ReelInteraction.interaction_type == itype
    ).first()

    if itype == "watch":
        if existing:
            # accumulate watch time
            existing.watch_time = (existing.watch_time or 0) + max(0, payload.watch_time)
            db.add(existing)
            db.commit()
        else:
            interaction = models.ReelInteraction(
                media_id=media_id,
                user_id=current_user.id,
                interaction_type=itype,
                watch_time=max(0, payload.watch_time)
            )
            db.add(interaction)
            db.commit()
    else:
        # share or other non-like interactions: create if not exists
        if existing:
            # already recorded; no-op
            pass
        else:
            interaction = models.ReelInteraction(
                media_id=media_id,
                user_id=current_user.id,
                interaction_type=itype,
                watch_time=max(0, payload.watch_time)
            )
            db.add(interaction)
            db.commit()
    likes = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == media.post_id,
        models.Interaction.interaction_type == "like"
    ).scalar() or 0
    shares = db.query(func.count(models.ReelInteraction.id)).filter(
        models.ReelInteraction.media_id == media_id,
        models.ReelInteraction.interaction_type == "share"
    ).scalar() or 0
    return {"success": True, "data": {"status": action, "like_count": int(likes), "share_count": int(shares)}}


@router.post("/{media_id}/comments", response_model=CommentResponse, status_code=201)
def create_reel_comment(
    media_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    media = db.query(models.PostMedia).filter(
        models.PostMedia.id == media_id,
        models.PostMedia.media_type == "video"
    ).first()
    if not media:
        raise HTTPException(status_code=404, detail="Không tìm thấy reel")
    return create_comment_for_post(
        post_id=media.post_id,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        current_user=current_user,
        db=db
    )


@router.get("/{media_id}/comments", response_model=List[CommentResponse])
def get_reel_comments(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_optional_user)
):
    media = db.query(models.PostMedia).filter(
        models.PostMedia.id == media_id,
        models.PostMedia.media_type == "video"
    ).first()
    if not media:
        raise HTTPException(status_code=404, detail="Không tìm thấy reel")
    return get_comments_for_post(post_id=media.post_id, db=db, current_user=current_user)


@router.get("/{media_id}/thumbnail")
def get_reel_thumbnail(media_id: int, db: Session = Depends(get_db)):
    media = db.query(models.PostMedia).filter(
        models.PostMedia.id == media_id,
        models.PostMedia.media_type == "video"
    ).first()
    if not media:
        raise HTTPException(status_code=404, detail="Không tìm thấy reel")
    if media.mime_type not in SUPPORTED_VIDEO_MIME:
        raise HTTPException(status_code=400, detail="Định dạng video không hỗ trợ tạo thumbnail")

    source_path = os.path.join(UPLOADS_DIR, os.path.basename(media.file_url))
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file video")

    thumb_path = os.path.join(THUMB_DIR, f"{media_id}.jpg")
    if not os.path.exists(thumb_path):
        ffmpeg_bin = shutil.which("ffmpeg")
        if ffmpeg_bin:
            try:
                subprocess.run(
                    [
                        ffmpeg_bin,
                        "-y",
                        "-ss",
                        "00:00:00.7",
                        "-i",
                        source_path,
                        "-frames:v",
                        "1",
                        "-vf",
                        "scale=480:-1",
                        thumb_path
                    ],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except Exception:
                pass

    if os.path.exists(thumb_path):
        response = FileResponse(thumb_path, media_type="image/jpeg")
        response.headers["Cache-Control"] = "public, max-age=86400"
        return response

    fallback_svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='270'>"
        "<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>"
        "<stop offset='0%' stop-color='#0F172A'/>"
        "<stop offset='100%' stop-color='#111827'/>"
        "</linearGradient></defs>"
        "<rect width='100%' height='100%' fill='url(#g)'/>"
        "<circle cx='240' cy='135' r='34' fill='rgba(255,255,255,0.12)'/>"
        "<polygon points='228,116 228,154 260,135' fill='white'/>"
        "</svg>"
    )
    return Response(content=fallback_svg, media_type="image/svg+xml")
