from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import models
import schemas
import os
import uuid
import traceback

router = APIRouter(prefix="/api/media", tags=["Media"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/{post_id}", status_code=status.HTTP_201_CREATED)
async def upload_media(post_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        if post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền thêm media vào bài viết này")

        mime_type = file.content_type or ""
        if mime_type.startswith("image/"):
            media_type = "image"
        elif mime_type.startswith("audio/"):
            media_type = "audio"
        else:
            raise HTTPException(status_code=400, detail="File không được hỗ trợ")
        
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="file quá lớn(tối đa 10MB)")

        ext = os.path.splitext(file.filename or "file")[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as f:
            f.write(contents)

        media = models.PostMedia(
            post_id = post.id,
            file_url=f"/api/media/files/{unique_name}",
            file_name=file.filename or "file",
            file_size=len(contents),
            media_type=media_type,
            mime_type=mime_type
        )
        db.add(media)
        db.commit()
        db.refresh(media)

        print(f"[UPLOAD OK] id={media.id}, file={unique_name}")

        return {
            "id": media.id,
            "post_id": media.post_id,
            "file_url": media.file_url,
            "file_name": media.file_name,
            "file_size": media.file_size,
            "media_type": media.media_type,
            "mime_type": media.mime_type,
            "created_at": str(media.created_at)
        }
    
    except HTTPException as e:
        print(f"[UPLOAD HTTP ERROR] {e.status_code}: {e.detail}")
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Upload lỗi: {str(e)}")

@router.get("/files/{filename}")
async def serve_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại")
    return FileResponse(file_path)
