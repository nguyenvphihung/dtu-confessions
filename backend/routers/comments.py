from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
from auth import get_current_user, get_optional_user
import models
import schemas

router = APIRouter(tags=["Comments"])

@router.post("/api/posts/{post_id}/comments", response_model=schemas.CommentCreate, status_code=status.HTTP_201_CREATED)
def create_comment(post_id: int, comment_data: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    
    if comment_data.parent_id:
        parent = db.query(models.Comment).filter(models.Comment.id == comment_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Không tìm thấy bình luận gốc")
        if parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Bình luận gốc không thuộc bài viết này")
        
    new_comment = models.Comment(
        user_id=current_user.id,
        post_id=post_id,
        parent_id=comment_data.parent_id,
        content=comment_data.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "user_id": new_comment.user_id,
        "post_id": new_comment.post_id,
        "parent_id": new_comment.parent_id,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
        "user": current_user,
        "like_count": 0,
        "user_liked": False,
        "replies": []
    }

@router.get("/api/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_optional_user)):
    likes_subq = db.query(func.count(models.CommentInteraction.id)).filter(
        models.CommentInteraction.comment_id == models.Comment.id,
        models.CommentInteraction.interaction_type == "like"
    ).correlate(models.Comment).scalar_subquery()

    query = db.query(models.Comment, likes_subq.label("like_count")).options(joinedload(models.Comment.user)).filter(models.Comment.post_id == post_id)

    if current_user:
        user_liked_subq = db.query(models.CommentInteraction.id).filter(
            models.CommentInteraction.comment_id == models.Comment.id,
            models.CommentInteraction.user_id == current_user.id,
            models.CommentInteraction.interaction_type == "like"
        ).correlate(models.Comment).exists()
        query = query.add_columns(user_liked_subq.label("user_liked"))

    results = query.order_by(models.Comment.created_at.asc()).all()

    comment_dict = {}
    for row in results:
        if current_user:
            comment, like_count, user_liked = row
        else:
            comment, like_count = row
            user_liked = False
        
        comment_dict[comment.id] = {
            "id": comment.id,
            "user_id": comment.user_id,
            "post_id": comment.post_id,
            "parent_id": comment.parent_id,
            "content": comment.content,
            "created_at": comment.created_at,
            "user": comment.user,
            "like_count": like_count,
            "user_liked": user_liked,
            "replies": []
        }

    root_comments = []
    for comment_id, comment_data in comment_dict.items():
        if comment_data["parent_id"] is None:
            root_comments.append(comment_data)
        else:
            parent_id = comment_data["parent_id"]
            if parent_id in comment_dict:
                comment_dict[parent_id]["replies"].append(comment_data)

    return root_comments


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Không tìm thấy comment")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa comment này")

    db.delete(comment)
    db.commit()


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
        return {"status": "unliked"}
    else:
        new_like = models.CommentInteraction(user_id=current_user.id, comment_id=comment_id, interaction_type="like")
        db.add(new_like)
        db.commit()
        return {"status": "liked"}