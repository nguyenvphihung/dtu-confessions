# MinIO (local) setup

This document shows how to run a local MinIO instance for development and connect the backend that provides presigned upload support.

1) Start MinIO with Docker Compose

From the repository root run:

```bash
docker compose -f docker-compose.minio.yml up -d
```

This exposes:
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

Default credentials (in the compose file): `minioadmin` / `minioadmin`.

2) Configure backend environment

Copy the sample env file and edit values if needed:

```bash
cp backend/.env.sample backend/.env
# edit backend/.env and confirm MINIO_* values
```

On PowerShell you can set env vars temporarily:

```powershell
$env:MINIO_ENDPOINT="localhost:9000"
$env:MINIO_ACCESS_KEY="minioadmin"
$env:MINIO_SECRET_KEY="minioadmin"
$env:MINIO_BUCKET="dtu-confessions"
$env:MINIO_SECURE="false"
```

3) Restart backend

Restart your FastAPI server so it picks up new env vars.

4) Test presign/upload/complete flow (example with curl)

- Request presigned URL (replace <TOKEN> and post_id):

```bash
curl -X POST "http://localhost:8000/api/media/presign/1" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"file_name":"video.mp4","mime_type":"video/mp4"}'
```

Server returns `upload_url` and `object_name`.

- Upload the file using HTTP PUT:

```bash
curl -X PUT "<upload_url>" -H "Content-Type: video/mp4" --upload-file ./video.mp4
```

- Complete the upload (register media in DB):

```bash
curl -X POST "http://localhost:8000/api/media/presign/complete/1?object_name=<object_name>" \
  -H "Authorization: Bearer <TOKEN>"
```

5) Notes
- The backend will attempt to create the bucket on startup if it does not exist.
- Currently backend stores `file_url` as `http(s)://<MINIO_ENDPOINT>/<bucket>/<object>`; for production consider serving via CDN or using presigned GETs for private buckets.
- When deleting posts/media you should also remove objects from MinIO. Consider adding a background worker to delete objects on cascade.
