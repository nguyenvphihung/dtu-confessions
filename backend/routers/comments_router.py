from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user, get_optional_user
import models
import schemas
from services.comment_service import create_comment_for_post, get_comments_for_post

router = APIRouter(tags=["Comments"])

@router.post("/api/posts/{post_id}/comments", response_model=schemas.CommentCreate, status_code=status.HTTP_201_CREATED)
def create_comment(post_id: int, comment_data: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return create_comment_for_post(
        post_id=post_id,
        content=comment_data.content,
        parent_id=comment_data.parent_id,
        current_user=current_user,
        db=db
    )

@router.get("/api/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_optional_user)):
    return get_comments_for_post(post_id=post_id, db=db, current_user=current_user)


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Không tìm thấy comment")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa comment này")

    db.delete(comment)
    db.commit()
