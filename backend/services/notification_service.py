from sqlalchemy.orm import Session
from typing import Optional
import models


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    message: str,
    ref_type: Optional[str] = None,
    ref_id: Optional[int] = None,
):
    """Create a notification for a user. Silently skips if user_id is None."""
    if not user_id:
        return None
    notification = models.Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        ref_type=ref_type,
        ref_id=ref_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
