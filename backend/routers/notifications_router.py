from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Lấy danh sách thông báo của user hiện tại."""
    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    )
    total = query.count()
    notifications = query.order_by(
        desc(models.Notification.created_at)
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "ref_type": n.ref_type,
                "ref_id": n.ref_id,
                "is_read": n.is_read,
                "created_at": n.created_at,
            } for n in notifications
        ]
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Đếm số thông báo chưa đọc."""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Đánh dấu một thông báo đã đọc."""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")

    notification.is_read = True
    db.commit()
    return {"message": "Đã đánh dấu đã đọc"}


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Đánh dấu tất cả thông báo đã đọc."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "Đã đánh dấu tất cả thông báo đã đọc"}
