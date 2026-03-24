from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
from services.notification_service import create_notification
import models

router = APIRouter(tags=["Interactions"])

def _success(data=None, message="Thành công"):
    return {
        "success": True,
        "message": message,
        "data": data
    }

@router.post("/api/posts/{post_id}/like", status_code=status.HTTP_200_OK)
def like_post(post_id: int, type: str = "like", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    
    existing = db.query(models.Interaction).filter(
        models.Interaction.user_id == current_user.id,
        models.Interaction.post_id == post_id
    ).first()

    if existing:
        if existing.interaction_type == type:
            db.delete(existing)
            db.commit()
            like_count = db.query(func.count(models.Interaction.id)).filter(
                models.Interaction.post_id == post_id
            ).scalar() or 0
            return _success(
                data={"status": "unliked", "post_id": post_id, "like_count": int(like_count), "reaction_type": None},
                message="Đã bỏ tương tác"
            )
        else:
            existing.interaction_type = type
            db.commit()
            like_count = db.query(func.count(models.Interaction.id)).filter(
                models.Interaction.post_id == post_id
            ).scalar() or 0
            if post.author_id != current_user.id:
                liker_name = current_user.display_name or current_user.student_id
                create_notification(
                    db=db,
                    user_id=post.author_id,
                    notification_type="new_like",
                    message=f"{liker_name} đã thả cảm xúc vào confession của bạn",
                    ref_type="post",
                    ref_id=post_id,
                )
            return _success(
                data={"status": "liked", "post_id": post_id, "like_count": int(like_count), "reaction_type": type},
                message="Đã đổi tương tác"
            )

    interaction = models.Interaction(
        user_id=current_user.id,
        post_id=post_id,
        interaction_type=type
    )
    db.add(interaction)
    db.commit()
    like_count = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == post_id
    ).scalar() or 0

    # Notify post author
    if post.author_id != current_user.id:
        liker_name = current_user.display_name or current_user.student_id
        create_notification(
            db=db,
            user_id=post.author_id,
            notification_type="new_like",
            message=f"{liker_name} đã thả cảm xúc vào confession của bạn",
            ref_type="post",
            ref_id=post_id,
        )

    return _success(
        data={
            "status": "liked",
            "post_id": post_id,
            "like_count": int(like_count),
            "reaction_type": type
        },
        message="Đã tương tác thành công"
    )

@router.delete("/api/posts/{post_id}/like", status_code=status.HTTP_200_OK)
def unlike_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    interaction = db.query(models.Interaction).filter(
        models.Interaction.user_id == current_user.id,
        models.Interaction.post_id == post_id,
        models.Interaction.interaction_type == "like"
    ).first()

    if not interaction:
        raise HTTPException(status_code=404, detail="Chưa like bài viết này")
    
    db.delete(interaction)
    db.commit()
    return _success(message="Đã bỏ like bài viết")

@router.post("/api/comments/{comment_id}/like", status_code=status.HTTP_200_OK)
def like_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Không tìm thấy bình luận")
    
    existing = db.query(models.CommentInteraction).filter(
        models.CommentInteraction.user_id == current_user.id,
        models.CommentInteraction.comment_id == comment_id,
        models.CommentInteraction.interaction_type == "like"
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        like_count = db.query(func.count(models.CommentInteraction.id)).filter(
            models.CommentInteraction.comment_id == comment_id,
            models.CommentInteraction.interaction_type == "like"
        ).scalar() or 0
        return _success(
            data={"status": "unliked", "comment_id": comment_id, "like_count": like_count},
            message="Đã bỏ like bình luận"
        )

    interaction = models.CommentInteraction(
        user_id=current_user.id,
        comment_id=comment_id,
        interaction_type="like"
    )
    db.add(interaction)
    db.commit()
    like_count = db.query(func.count(models.CommentInteraction.id)).filter(
        models.CommentInteraction.comment_id == comment_id,
        models.CommentInteraction.interaction_type == "like"
    ).scalar() or 0
    return _success(
        data={"status": "liked", "comment_id": comment_id, "like_count": like_count},
        message="Đã like bình luận"
    )

@router.delete("/api/comments/{comment_id}/like", status_code=status.HTTP_200_OK)
def unlike_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    interaction = db.query(models.CommentInteraction).filter(
        models.CommentInteraction.user_id == current_user.id,
        models.CommentInteraction.comment_id == comment_id,
        models.CommentInteraction.interaction_type == "like"
    ).first()

    if not interaction:
        raise HTTPException(status_code=404, detail="Chưa like comment này")
    
    db.delete(interaction)
    db.commit()
    like_count = db.query(func.count(models.CommentInteraction.id)).filter(
        models.CommentInteraction.comment_id == comment_id,
        models.CommentInteraction.interaction_type == "like"
    ).scalar() or 0
    return _success(
        data={"status": "unliked", "comment_id": comment_id, "like_count": like_count},
        message="Đã bỏ like bình luận"
    )

