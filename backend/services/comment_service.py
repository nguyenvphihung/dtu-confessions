from __future__ import annotations
from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import models


def create_comment_for_post(
    post_id: int,
    content: str,
    parent_id: int | None,
    current_user: models.User,
    db: Session,
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")

    if parent_id:
        parent = db.query(models.Comment).filter(models.Comment.id == parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Không tìm thấy bình luận gốc")
        if parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Bình luận gốc không thuộc bài viết này")

    new_comment = models.Comment(
        user_id=current_user.id,
        post_id=post_id,
        parent_id=parent_id,
        content=content
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


def get_comments_for_post(post_id: int, db: Session, current_user: models.User | None) -> List[dict]:
    likes_subq = db.query(func.count(models.CommentInteraction.id)).filter(
        models.CommentInteraction.comment_id == models.Comment.id,
        models.CommentInteraction.interaction_type == "like"
    ).correlate(models.Comment).scalar_subquery()

    query = db.query(models.Comment, likes_subq.label("like_count")).options(
        joinedload(models.Comment.user)
    ).filter(models.Comment.post_id == post_id)

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
    for comment_data in comment_dict.values():
        if comment_data["parent_id"] is None:
            root_comments.append(comment_data)
        else:
            parent_id = comment_data["parent_id"]
            if parent_id in comment_dict:
                comment_dict[parent_id]["replies"].append(comment_data)

    return root_comments
