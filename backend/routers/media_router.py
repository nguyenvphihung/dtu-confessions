from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import os
import uuid
import traceback
import shutil
import mimetypes
import json
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from pydantic import BaseModel

router = APIRouter(prefix="/api/media", tags=["Media"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
CHUNK_DIR = os.path.join(UPLOAD_DIR, ".chunks")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHUNK_DIR, exist_ok=True)
MAX_UPLOAD_SIZE = 120 * 1024 * 1024

# MinIO configuration (optional)
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "dtu-confessions")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

minio_client = None
if MINIO_ENDPOINT and MINIO_ACCESS_KEY and MINIO_SECRET_KEY:
    try:
        minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=MINIO_SECURE)
        if not minio_client.bucket_exists(MINIO_BUCKET):
            minio_client.make_bucket(MINIO_BUCKET)
            
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                    "Resource": f"arn:aws:s3:::{MINIO_BUCKET}",
                },
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": f"arn:aws:s3:::{MINIO_BUCKET}/*",
                },
            ],
        }
        minio_client.set_bucket_policy(MINIO_BUCKET, json.dumps(policy))
    except Exception as e:
        print("MinIO Config Error:", e)
        minio_client = None


class PresignRequest(BaseModel):
    file_name: str
    mime_type: str


@router.post("/presign/{post_id}")
def presign_upload(post_id: int, req: PresignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO không được cấu hình trên server")

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thêm media vào bài viết này")

    ext = os.path.splitext(req.file_name or "file")[1]
    object_name = f"{uuid.uuid4()}{ext}"
    # presign PUT URL
    try:
        url = minio_client.presigned_put_object(MINIO_BUCKET, object_name, expires=timedelta(minutes=15))
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"Không thể tạo presigned URL: {str(e)}")

    return {
        "upload_url": url,
        "object_name": object_name,
        "expires_in": 900
    }


@router.post("/presign/complete/{post_id}")
def presign_complete(post_id: int, object_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO không được cấu hình trên server")

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thêm media vào bài viết này")

    try:
        stat = minio_client.stat_object(MINIO_BUCKET, object_name)
    except S3Error:
        raise HTTPException(status_code=404, detail="Không tìm thấy object trên storage")

    mime_type = stat.content_type or "application/octet-stream"
    media_type = _detect_media_type(mime_type)
    if not media_type:
        raise HTTPException(status_code=400, detail="File không được hỗ trợ")

    # Build a public URL to store (best-effort)
    scheme = "https" if MINIO_SECURE else "http"
    file_url = f"{scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{object_name}"

    media = models.PostMedia(
        post_id=post.id,
        file_url=file_url,
        file_name=object_name,
        file_size=stat.size,
        media_type=media_type,
        mime_type=mime_type
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return _success(data=_build_media_payload(media), message="Đăng ký media thành công")


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

        file_url = f"/api/media/files/{unique_name}"
        if minio_client:
            minio_client.fput_object(MINIO_BUCKET, unique_name, file_path, content_type=mime_type)
            scheme = "https" if MINIO_SECURE else "http"
            file_url = f"{scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{unique_name}"
            os.remove(file_path)

        media = models.PostMedia(
            post_id = post.id,
            file_url=file_url,
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

        file_url = f"/api/media/files/{unique_name}"
        if minio_client:
            minio_client.fput_object(MINIO_BUCKET, unique_name, final_path, content_type=mime_type)
            scheme = "https" if MINIO_SECURE else "http"
            file_url = f"{scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{unique_name}"
            os.remove(final_path)

        media = models.PostMedia(
            post_id=post.id,
            file_url=file_url,
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

@router.post("/upload-profile", status_code=status.HTTP_201_CREATED)
async def upload_profile_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    mime_type = file.content_type or ""
    if not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file ảnh")
        
    ext = os.path.splitext(file.filename or "file")[1]
    unique_name = f"profile-{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    try:
        with open(file_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
    finally:
        await file.close()
        
    if minio_client:
        try:
            minio_client.fput_object(MINIO_BUCKET, unique_name, file_path, content_type=mime_type)
            scheme = "https" if MINIO_SECURE else "http"
            file_url = f"{scheme}://{MINIO_ENDPOINT}/{MINIO_BUCKET}/{unique_name}"
            os.remove(file_path)
            return _success(data={"file_url": file_url}, message="Upload ảnh thành công")
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Lỗi MinIO: {str(e)}")
            
    return _success(data={"file_url": f"/api/media/files/{unique_name}"}, message="Upload ảnh thành công")

@router.get("/files/{filename}")
async def serve_file(filename: str, request: Request):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File không tồn tại")
    file_size = os.path.getsize(file_path)
    media_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    range_header = request.headers.get("range")

    if not range_header:
        response = FileResponse(file_path, media_type=media_type)
        response.headers["Accept-Ranges"] = "bytes"
        response.headers["Cache-Control"] = "public, max-age=2592000"
        return response

    if not range_header.startswith("bytes="):
        raise HTTPException(status_code=416, detail="Range không hợp lệ")

    range_value = range_header.replace("bytes=", "", 1).strip()
    start_str, _, end_str = range_value.partition("-")
    try:
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
    except ValueError:
        raise HTTPException(status_code=416, detail="Range không hợp lệ")

    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(status_code=416, detail="Range vượt quá kích thước file")

    chunk_size = 1024 * 1024
    content_length = end - start + 1

    def iter_file():
        with open(file_path, "rb") as f:
            f.seek(start)
            bytes_remaining = content_length
            while bytes_remaining > 0:
                read_size = min(chunk_size, bytes_remaining)
                data = f.read(read_size)
                if not data:
                    break
                bytes_remaining -= len(data)
                yield data

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Content-Length": str(content_length),
        "Cache-Control": "public, max-age=2592000"
    }

    return StreamingResponse(
        iter_file(),
        status_code=206,
        media_type=media_type,
        headers=headers
    )
