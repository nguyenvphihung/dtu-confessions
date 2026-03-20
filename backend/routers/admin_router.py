from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc
from datetime import datetime, timezone
from database import get_db
from auth import get_admin_user
from services.notification_service import create_notification
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
    role: str = Body(..., embed=True, description="'admin' hoặc 'user'"),
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


# ============================================================
# POST MODERATION
# ============================================================

@router.get("/pending-posts")
def get_pending_posts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Lấy danh sách bài viết đang chờ duyệt."""
    query = db.query(models.Post).options(
        joinedload(models.Post.author),
        joinedload(models.Post.media),
    ).filter(models.Post.status == "pending")

    total = query.count()
    posts = query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": p.id,
                "author_id": p.author_id,
                "content": p.content,
                "is_anonymous": p.is_anonymous,
                "status": p.status,
                "created_at": p.created_at,
                "media_count": len(p.media) if p.media else 0,
                "author": {
                    "id": p.author.id,
                    "student_id": p.author.student_id,
                    "display_name": p.author.display_name,
                } if p.author else None
            } for p in posts
        ]
    }


@router.put("/posts/{post_id}/approve")
def approve_post(
    post_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Duyệt bài viết và gán confession number tự động."""
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    if post.status == "approved":
        raise HTTPException(status_code=400, detail="Bài viết đã được duyệt rồi")

    # Generate next confession_number
    max_num = db.query(func.max(models.Post.confession_number)).scalar() or 0
    post.status = "approved"
    post.confession_number = max_num + 1
    post.rejected_reason = None
    db.commit()

    # Notify author
    create_notification(
        db=db,
        user_id=post.author_id,
        notification_type="post_approved",
        message=f"Confession #{post.confession_number} của bạn đã được duyệt! 🎉",
        ref_type="post",
        ref_id=post.id,
    )

    return {"message": f"Đã duyệt bài viết thành #DTU_CFS_{post.confession_number}"}


@router.put("/posts/{post_id}/reject")
def reject_post(
    post_id: int,
    reason: Optional[str] = Body(None, embed=True, description="Lý do từ chối"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Từ chối bài viết."""
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    if post.status == "approved":
        raise HTTPException(status_code=400, detail="Không thể từ chối bài đã duyệt")

    post.status = "rejected"
    post.rejected_reason = reason
    db.commit()

    # Notify author
    msg = "Confession của bạn đã bị từ chối."
    if reason:
        msg += f" Lý do: {reason}"
    create_notification(
        db=db,
        user_id=post.author_id,
        notification_type="post_rejected",
        message=msg,
        ref_type="post",
        ref_id=post.id,
    )

    return {"message": "Đã từ chối bài viết"}


# ============================================================
# REPORT MANAGEMENT
# ============================================================

@router.get("/reports")
def get_reports(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = Query(None, description="pending, resolved, dismissed"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Lấy danh sách báo cáo vi phạm."""
    query = db.query(models.Report).options(
        joinedload(models.Report.reporter)
    )
    if status:
        query = query.filter(models.Report.status == status)

    total = query.count()
    reports = query.order_by(models.Report.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for r in reports:
        # Enrich with target content
        target_content = None
        target_author = None
        if r.target_type == "post":
            post = db.query(models.Post).options(joinedload(models.Post.author)).filter(models.Post.id == r.target_id).first()
            if post:
                target_content = post.content[:200] if post.content else None
                target_author = post.author.display_name or post.author.student_id if post.author else None
        elif r.target_type == "comment":
            comment = db.query(models.Comment).options(joinedload(models.Comment.user)).filter(models.Comment.id == r.target_id).first()
            if comment:
                target_content = comment.content[:200] if comment.content else None
                target_author = comment.user.display_name or comment.user.student_id if comment.user else None

        items.append({
            "id": r.id,
            "reporter_id": r.reporter_id,
            "target_type": r.target_type,
            "target_id": r.target_id,
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at,
            "resolved_at": r.resolved_at,
            "reporter": {
                "id": r.reporter.id,
                "display_name": r.reporter.display_name,
                "student_id": r.reporter.student_id,
            } if r.reporter else None,
            "target_content": target_content,
            "target_author": target_author,
        })

    return {"total": total, "items": items}


@router.put("/reports/{report_id}/resolve")
def resolve_report(
    report_id: int,
    action: str = Body(..., embed=True, description="'resolved' hoặc 'dismissed'"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Xử lý hoặc bỏ qua báo cáo vi phạm."""
    if action not in ["resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Action phải là 'resolved' hoặc 'dismissed'")

    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Báo cáo này đã được xử lý")

    report.status = action
    report.resolved_at = datetime.now(timezone.utc)
    db.commit()

    status_text = "đã xử lý" if action == "resolved" else "đã bỏ qua"
    return {"message": f"Báo cáo #{report.id} {status_text}"}

