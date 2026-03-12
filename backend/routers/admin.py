from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from auth import get_admin_user
import models
import schemas
from typing import Optional

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def get_all_users(
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = Query(None, description="Tìm theo tên hiển thị, mã SV hoặc email"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    query = db.query(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.User.display_name.ilike(search_term),
                models.User.student_id.ilike(search_term),
                models.User.email.ilike(search_term)
            )
        )
        
    total_users = query.count()
    users = query.order_by(models.User.id.desc()).offset(skip).limit(limit).all()

    return {
        "total": total_users,
        "items": [
            {
                "id": u.id,
                "student_id": u.student_id,
                "display_name": u.display_name,
                "email": u.email,
                "role": getattr(u, "role", "user"),
                "is_banned": getattr(u, "is_banned", False),
                "created_at": u.created_at
            } for u in users
        ]
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int, 
    role: str = Query(..., description="'admin' hoặc 'user'"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Quyền không hợp lệ")
        
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự giáng quyền của chính mình")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    user.role = role
    db.commit()
    return {"message": f"Đã cập nhật quyền của {user.student_id} thành {role}"}


@router.put("/users/{user_id}/ban")
def ban_unban_user(
    user_id: int,
    is_banned: bool = Query(..., description="True (Ban) hoặc False (Unban)"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Ban hoặc Unban tài khoản."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Bạn không thể cấm chính mình")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    if user.role == "admin" and is_banned:
         raise HTTPException(status_code=400, detail="Không thể cấm một quản trị viên khác")
         
    user.is_banned = is_banned
    db.commit()
    
    status_text = "đã bị cấm" if is_banned else "đã được gỡ cấm"
    return {"message": f"Tài khoản {user.student_id} {status_text}"}


@router.delete("/posts/{post_id}")
def delete_any_post(
    post_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
        
    db.delete(post)
    db.commit()
    return {"message": "Đã xoá bài viết thành công"}


@router.delete("/comments/{comment_id}")
def delete_any_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        
    db.delete(comment)
    db.commit()
    return {"message": "Đã xoá bình luận thành công"}

