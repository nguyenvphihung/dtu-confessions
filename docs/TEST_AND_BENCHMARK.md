# Test và Benchmark

## Unit Test Suite

Frontend sử dụng Vitest + Testing Library:

- `src/utils/videoEditor.test.js`
- `src/components/AutoPlayVideo.test.jsx`
- `src/api/reels.test.js`

Chạy test:

```bash
npm run test
```

Coverage:

```bash
npm run test:coverage
```

## Integration Test Scenarios

1. Tạo post có video, mở editor, trim + crop, upload chunk thành công.
2. Feed autoplay video khi vào viewport, pause khi out viewport.
3. Click video ở feed mở modal playback, đóng modal thì video pause.
4. Reels bar hiển thị dữ liệu theo ngày và mở trang reels.
5. Trang reels swipe dọc, double tap like, share thành công.
6. Reels tracking gửi `view` và `analytics` cho watch time.

## Performance Benchmarking Report

### Mục tiêu

- First Contentful Paint < 1.5s
- Time to Interactive < 3s

### Thiết lập đo

- Lighthouse Mobile mode, network Fast 4G
- Browser Chrome latest stable
- Test trên route `/` và `/reels`

### Kết quả baseline sau nâng cấp

- Feed route: lazy metadata loading cho reels và video preload metadata.
- Reels route: snap container + incremental fetch theo trang.
- Upload: chunked upload giảm peak memory và retry cục bộ theo chunk.

### Khuyến nghị tối ưu thêm

- Tạo thumbnail server-side để giảm tải decode video ở feed.
- Áp dụng CDN cho media static.
- Cache API `reels/daily` tại reverse proxy 30–60s.
