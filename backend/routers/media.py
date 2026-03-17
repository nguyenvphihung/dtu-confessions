from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import os
import uuid
import traceback
import shutil

router = APIRouter(prefix="/api/media", tags=["Media"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
CHUNK_DIR = os.path.join(UPLOAD_DIR, ".chunks")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHUNK_DIR, exist_ok=True)
MAX_UPLOAD_SIZE = 120 * 1024 * 1024

def _detect_media_type(mime_type: str):
    if mime_type.startswith("image/"):
        return "image"
    if mime_type.startswith("audio/"):
        return "audio"
    if mime_type.startswith("video/"):
        return "video"
    return None

def _build_media_payload(media: models.PostMedia):
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

def _success(data=None, message="Thành công"):
    return {
        "success": True,
        "message": message,
        "data": data
    }

@router.post("/upload/{post_id}", status_code=status.HTTP_201_CREATED)
async def upload_media(post_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        if post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền thêm media vào bài viết này")

        mime_type = file.content_type or ""
        media_type = _detect_media_type(mime_type)
        if not media_type:
            raise HTTPException(status_code=400, detail="File không được hỗ trợ")

        ext = os.path.splitext(file.filename or "file")[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        total_size = 0
        try:
            with open(file_path, "wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    total_size += len(chunk)
                    if total_size > MAX_UPLOAD_SIZE:
                        raise HTTPException(status_code=400, detail="File vượt quá dung lượng cho phép")
                    f.write(chunk)
        except Exception:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise
        finally:
            await file.close()

        media = models.PostMedia(
            post_id = post.id,
            file_url=f"/api/media/files/{unique_name}",
            file_name=file.filename or "file",
            file_size=total_size,
            media_type=media_type,
            mime_type=mime_type
        )
        db.add(media)
        db.commit()
        db.refresh(media)

        return _success(
            data=_build_media_payload(media),
            message="Upload media thành công"
        )
    
    except HTTPException as e:
        print(f"[UPLOAD HTTP ERROR] {e.status_code}: {e.detail}")
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Upload lỗi: {str(e)}")

@router.post("/upload-chunk/{post_id}", status_code=status.HTTP_200_OK)
async def upload_media_chunk(
    post_id: int,
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    file_name: str = Form(...),
    mime_type: str = Form(...),
    chunk: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thêm media vào bài viết này")

    media_type = _detect_media_type(mime_type or "")
    if not media_type:
        raise HTTPException(status_code=400, detail="File không được hỗ trợ")
    if total_chunks <= 0 or chunk_index < 0 or chunk_index >= total_chunks:
        raise HTTPException(status_code=400, detail="Thông tin chunk không hợp lệ")

    upload_temp_dir = os.path.join(CHUNK_DIR, upload_id)
    os.makedirs(upload_temp_dir, exist_ok=True)
    part_path = os.path.join(upload_temp_dir, f"part_{chunk_index:06d}")

    with open(part_path, "wb") as f:
        while True:
            data = await chunk.read(1024 * 1024)
            if not data:
                break
            f.write(data)
    await chunk.close()

    if chunk_index < total_chunks - 1:
        return _success(
            data={"upload_id": upload_id, "chunk_index": chunk_index, "completed": False},
            message="Đã nhận chunk"
        )

    ext = os.path.splitext(file_name or "file")[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    final_path = os.path.join(UPLOAD_DIR, unique_name)
    total_size = 0

    try:
        with open(final_path, "wb") as out:
            for idx in range(total_chunks):
                current_part = os.path.join(upload_temp_dir, f"part_{idx:06d}")
                if not os.path.exists(current_part):
                    raise HTTPException(status_code=400, detail=f"Thiếu chunk {idx}")
                with open(current_part, "rb") as pf:
                    shutil.copyfileobj(pf, out, length=1024 * 1024)
                total_size += os.path.getsize(current_part)
                if total_size > MAX_UPLOAD_SIZE:
                    raise HTTPException(status_code=400, detail="File vượt quá dung lượng cho phép")

        media = models.PostMedia(
            post_id=post.id,
            file_url=f"/api/media/files/{unique_name}",
            file_name=file_name or "file",
            file_size=total_size,
            media_type=media_type,
            mime_type=mime_type
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        return _success(
            data={"upload_id": upload_id, "completed": True, "media": _build_media_payload(media)},
            message="Upload media thành công"
        )
    except Exception:
        if os.path.exists(final_path):
            os.remove(final_path)
        raise
    finally:
        if os.path.exists(upload_temp_dir):
            shutil.rmtree(upload_temp_dir, ignore_errors=True)
        if total_size > MAX_UPLOAD_SIZE and os.path.exists(final_path):
            os.remove(final_path)

@router.get("/files/{filename}")
async def serve_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại")
    return FileResponse(file_path)
