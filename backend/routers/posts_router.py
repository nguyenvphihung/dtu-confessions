from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import List, Optional
from database import get_db
from auth import get_current_user
from jose import JWTError, jwt
import models
import schemas
import os

router = APIRouter(prefix="/api/posts", tags=["Posts"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_optional_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try: 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user = db.query(models.User).filter(models.User.id == int(user_id_str)).first()
        return user
    except (JWTError, ValueError):
        return None
    
def __format_post_response(post: models.Post, like_count: int, comment_count: int, user_reaction: Optional[str]) -> dict:
    media_list = []
    if hasattr(post, 'media') and post.media:
        for m in post.media:
            media_list.append({\
                "id": m.id,
                "post_id": m.post_id,
                "file_url": m.file_url,
                "file_name": m.file_name,
                "file_size": m.file_size,
                "media_type": m.media_type,
                "mime_type": m.mime_type,
                "created_at": m.created_at
                })
    result = {
        "id": post.id,
        "author_id": post.author_id,
        "content": post.content,
        "is_anonymous": bool(post.is_anonymous),
        "is_private": bool(post.is_private),
        "status": getattr(post, 'status', 'approved'),
        "confession_number": getattr(post, 'confession_number', None),
        "rejected_reason": getattr(post, 'rejected_reason', None),
        "created_at": post.created_at,
        "like_count": like_count,
        "comment_count": comment_count,
        "user_liked": bool(user_reaction),
        "user_reaction": user_reaction,
        "media": media_list,
        "author": None,
        "shared_post_id": getattr(post, 'shared_post_id', None),
        "shared_post": None
    }

    if getattr(post, 'shared_post', None) is not None:
        result["shared_post"] = __format_post_response(post.shared_post, 0, 0, None)

    if not post.is_anonymous and post.author:
        result["author"] = {
            "id": post.author.id,
            "student_id": post.author.student_id,
            "display_name": post.author.display_name,
            "email": post.author.email,
            "role": post.author.role,
            "is_banned": post.author.is_banned,
            "avatar_url": post.author.avatar_url,
            "cover_url": post.author.cover_url,
            "created_at": post.author.created_at
        }

    return result

    

@router.post("/", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post_data: schemas.PostCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_post = models.Post(
        author_id = current_user.id,
        content = post_data.content,
        is_anonymous = post_data.is_anonymous,
        is_private = post_data.is_private,
        shared_post_id = post_data.shared_post_id,
        status = "approved" if post_data.shared_post_id else "pending"
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return __format_post_response(new_post, 0, 0, None)

@router.get("/", response_model=List[schemas.PostResponse])
def get_posts(skip: int = 0, limit: int =20, search: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_optional_user)):
    likes_subq = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == models.Post.id
    ).correlate(models.Post).as_scalar()

    comments_subq = db.query(func.count(models.Comment.id)).filter(
        models.Comment.post_id == models.Post.id
    ).correlate(models.Post).as_scalar()

    query = db.query(models.Post, likes_subq.label("like_count"), comments_subq.label("comment_count")).options(
        joinedload(models.Post.author), 
        joinedload(models.Post.media),
        joinedload(models.Post.shared_post).joinedload(models.Post.author),
        joinedload(models.Post.shared_post).joinedload(models.Post.media)
    )
    
    if current_user:
        query = query.filter(or_(
            and_(models.Post.status == "approved", or_(
                models.Post.is_private == False,
                models.Post.is_private.is_(None),
                models.Post.author_id == current_user.id
            )),
            models.Post.author_id == current_user.id  # show own pending/rejected
        ))
    else:
        query = query.filter(
            models.Post.status == "approved",
            or_(
                models.Post.is_private == False,
                models.Post.is_private.is_(None)
            )
        )

    if current_user:
        user_reaction_subq = db.query(models.Interaction.interaction_type).filter(
            models.Interaction.post_id == models.Post.id,
            models.Interaction.user_id == current_user.id
        ).correlate(models.Post).as_scalar()
        query = query.add_columns(user_reaction_subq.label("user_reaction"))

    if search: 
        search_fmt = f"%{search}%"
        query = query.outerjoin(models.User, models.Post.author_id == models.User.id)
        filters = [
            models.Post.content.ilike(search_fmt),
            and_(models.Post.is_anonymous == False, models.User.display_name.ilike(search_fmt)),
            and_(models.Post.is_anonymous == False, models.User.student_id.ilike(search_fmt))
        ]

        if search.isdigit():
            filters.append(models.Post.confession_number == int(search))
        elif search.lower().startswith("dtu_cfs_") and search[8:].isdigit():
            filters.append(models.Post.confession_number == int(search[8:]))
        elif search.lower().startswith("#dtu_cfs_") and search[9:].isdigit():
            filters.append(models.Post.confession_number == int(search[9:]))

        query = query.filter(or_(*filters))

    results = query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()

    response = []
    for row in results:
        if current_user:
            post, like_count, comment_count, user_reaction = row
        else:
            post, like_count, comment_count = row
            user_reaction = None
        response.append(__format_post_response(post, like_count, comment_count, user_reaction))
    return response

@router.get("/user/{user_id}", response_model=List[schemas.PostResponse])
def get_user_posts(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: models.User = Depends(get_optional_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    likes_subq = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == models.Post.id
    ).correlate(models.Post).as_scalar()

    comments_subq = db.query(func.count(models.Comment.id)).filter(
        models.Comment.post_id == models.Post.id
    ).correlate(models.Post).as_scalar()

    query = db.query(models.Post, likes_subq.label("like_count"), comments_subq.label("comment_count")).options(
        joinedload(models.Post.author), 
        joinedload(models.Post.media),
        joinedload(models.Post.shared_post).joinedload(models.Post.author),
        joinedload(models.Post.shared_post).joinedload(models.Post.media)
    ).filter(models.Post.author_id == user_id)
    
    # Hide anonymous and private posts from others; also hide non-approved
    if not current_user or current_user.id != user_id:
        query = query.filter(
            models.Post.is_anonymous == False,
            models.Post.status == "approved",
            or_(models.Post.is_private == False, models.Post.is_private.is_(None))
        )

    if current_user:
        user_reaction_subq = db.query(models.Interaction.interaction_type).filter(
            models.Interaction.post_id == models.Post.id,
            models.Interaction.user_id == current_user.id
        ).correlate(models.Post).as_scalar()
        query = query.add_columns(user_reaction_subq.label("user_reaction"))

    results = query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()

    response = []
    for row in results:
        if current_user:
            post, like_count, comment_count, user_reaction = row
        else:
            post, like_count, comment_count = row
            user_reaction = None
        response.append(__format_post_response(post, like_count, comment_count, user_reaction))
    return response

@router.get("/{post_id}", response_model=schemas.PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_optional_user)):
    likes_subq = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.post_id == models.Post.id
    ).correlate(models.Post).scalar_subquery()

    comments_subq = db.query(func.count(models.Comment.id)).filter(
        models.Comment.post_id == models.Post.id
    ).correlate(models.Post).scalar_subquery()

    query = db.query(models.Post, likes_subq.label("like_count"), comments_subq.label("comment_count")).options(
        joinedload(models.Post.author), 
        joinedload(models.Post.media),
        joinedload(models.Post.shared_post).joinedload(models.Post.author),
        joinedload(models.Post.shared_post).joinedload(models.Post.media)
    ).filter(models.Post.id == post_id)

    if current_user:
        user_reaction_subq = db.query(models.Interaction.interaction_type).filter(
            models.Interaction.post_id == models.Post.id,
            models.Interaction.user_id == current_user.id
        ).correlate(models.Post).as_scalar()
        query = query.add_columns(user_reaction_subq.label("user_reaction"))

    row = query.first()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài post")
    
    post = row[0]
    if getattr(post, 'is_private', False) and (not current_user or current_user.id != post.author_id):
        raise HTTPException(status_code=403, detail="Bài viết này là riêng tư")
    
    if current_user:
        post, like_count, comment_count, user_reaction = row
    else:
        post, like_count, comment_count = row
        user_reaction = None
    
    return __format_post_response(post, like_count, comment_count, user_reaction)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài post")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bài post này")
    
    db.delete(post)
    db.commit()
    return None
