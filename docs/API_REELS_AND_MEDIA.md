# API Reels và Media

## Reels

- `GET /api/reels/daily?date=YYYY-MM-DD&skip=0&limit=12`
- `POST /api/reels/{media_id}/view?watch_time=3.2`
- `POST /api/reels/{media_id}/analytics`

### Body `POST /api/reels/{media_id}/analytics`

```json
{
  "action": "like",
  "watch_time": 0
}
```

`action` hỗ trợ `like`, `share`, `watch`.

## Media Upload

- `POST /api/media/upload/{post_id}` upload streaming theo block server-side
- `POST /api/media/upload-chunk/{post_id}` upload chunk phía client

### Body multipart `upload-chunk`

- `upload_id`: string
- `chunk_index`: number
- `total_chunks`: number
- `file_name`: string
- `mime_type`: string
- `chunk`: binary

## Error Contract

Tất cả lỗi backend sử dụng format thống nhất:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

## Swagger/OpenAPI

FastAPI tự động publish OpenAPI:

- Local backend: `http://localhost:8000/docs`
- JSON schema: `http://localhost:8000/openapi.json`
