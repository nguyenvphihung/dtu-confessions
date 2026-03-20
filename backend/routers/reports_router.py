from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """User báo cáo vi phạm bài viết hoặc bình luận."""
    if report_data.target_type not in ["post", "comment"]:
        raise HTTPException(status_code=400, detail="target_type phải là 'post' hoặc 'comment'")

    # Verify target exists
    if report_data.target_type == "post":
        target = db.query(models.Post).filter(models.Post.id == report_data.target_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
        if target.author_id == current_user.id:
            raise HTTPException(status_code=400, detail="Bạn không thể báo cáo bài viết của chính mình")
    else:
        target = db.query(models.Comment).filter(models.Comment.id == report_data.target_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Bình luận không tồn tại")
        if target.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Bạn không thể báo cáo bình luận của chính mình")

    # Check duplicate report
    existing = db.query(models.Report).filter(
        models.Report.reporter_id == current_user.id,
        models.Report.target_type == report_data.target_type,
        models.Report.target_id == report_data.target_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Bạn đã báo cáo nội dung này rồi")

    report = models.Report(
        reporter_id=current_user.id,
        target_type=report_data.target_type,
        target_id=report_data.target_id,
        reason=report_data.reason,
        description=report_data.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {"message": "Báo cáo đã được gửi thành công. Cảm ơn bạn!", "id": report.id}
