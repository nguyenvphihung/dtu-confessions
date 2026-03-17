# Deployment và Rollback

## Deployment

1. Cập nhật source code và biến môi trường production.
2. Build image:

```bash
docker compose build
```

3. Khởi chạy:

```bash
docker compose up -d
```

4. Kiểm tra health:

- `GET /docs` và `GET /openapi.json`
- Test login, tạo post video, upload chunk, vào reels.

## Rollback Procedure

1. Giữ lại tag image phiên bản ổn định trước đó.
2. Nếu release mới lỗi:

```bash
docker compose down
```

3. Khai báo lại image tag phiên bản cũ trong compose.
4. Start lại:

```bash
docker compose up -d
```

5. Verify dữ liệu DB và upload volume không bị mất.

## Dữ liệu cần backup

- PostgreSQL volume
- Upload volume `uploads_data`

## Checklist sau rollback

- API auth hoạt động
- Feed và comment hoạt động
- Reels endpoint trả dữ liệu
- Upload media mới thành công
