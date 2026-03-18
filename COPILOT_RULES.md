# Bộ luật hợp tác — GitHub Copilot (dành cho dự án)

Hướng dẫn này là bộ luật làm việc mà Copilot (và tôi) sẽ tuân theo khi phát triển, sửa đổi và trao đổi thay đổi trong repository này. Bạn có thể chỉnh sửa file này; mọi thay đổi được xem là chuẩn tham chiếu.

1) Ngôn ngữ giao tiếp
- Luôn dùng tiếng Việt cho mọi giao tiếp với tôi (trừ khi bạn yêu cầu khác rõ ràng).

2) Phong cách làm việc chung
- Trước khi thực hiện thay đổi lớn, tôi sẽ thông báo ngắn gọn (1 câu) **mục tiêu & kết quả** của bước sắp thực hiện.
- Trước khi gọi công cụ (file read/write, patch, tạo file), tôi sẽ gửi preamble ngắn (1-2 câu) giải thích việc sẽ làm.
- Mọi thay đổi mã nguồn phải tối thiểu, tập trung, và tương thích phong cách hiện có.
- Nếu yêu cầu chưa rõ hoặc chưa đủ chi tiết, tôi sẽ hỏi thêm cho đến khi đảm bảo hiểu và thực hiện được 100% nhiệm vụ

3) Quy tắc về sửa đổi code
- Luôn dùng `apply_patch` để sửa file hiện có; dùng `create_file` để tạo file mới.
- Tránh sửa những phần không liên quan trong cùng file.
- Không thêm header bản quyền hoặc license trừ khi được yêu cầu.
- Tuân thủ style hiện có: đặt tên file/biến theo kiểu hiện tại (Python: snake_case cho function/module, PascalCase cho class).

4) Kiểm thử & xác minh
- Khi thay đổi logic quan trọng (DB, API), nếu có tests hiện hữu liên quan, tôi sẽ chạy hoặc khuyến nghị chạy tests.
- Nếu sửa đổi DB schema, tôi sẽ đề xuất thêm migration Alembic (nêu rõ thay đổi SQL) và/hoặc khuyến nghị `ON DELETE` cascade ở DB nếu phù hợp.

5) Database & Migrations
- Ưu tiên sửa lỗi ở **nguyên nhân gốc** (ví dụ: ràng buộc FK) thay vì patch tạm thời.
- Nếu thay đổi model SQLAlchemy cần migration: tôi sẽ tạo (hoặc hướng dẫn tạo) file Alembic migration và mô tả các bước chạy `alembic revision --autogenerate` và `alembic upgrade head`.

6) Bảo mật & secrets
- Không ghi secrets vào code hoặc commit (.env chỉ local). Luôn dùng `os.getenv`/config và document biến môi trường cần thiết.

7) Tài liệu & commit
- Mọi thay đổi lớn cần mô tả ngắn trong commit message: `scope: ngắn mô tả` (ví dụ `backend: add cascade delete for post_media -> reel_interactions`).
- Nếu cập nhật contract API (schemas), đồng thời cập nhật `docs/` hoặc README liên quan.

8) Quy ước review & PR
- Yêu cầu review cho thay đổi ảnh hưởng DB, auth, hoặc public API.
- Kèm hướng dẫn chạy nhanh để reviewer kiểm tra (commands ngắn gọn).

9) Cách tham chiếu tập tin / symbol
- Trong giao tiếp, khi đề cập file hoặc symbol, tôi sẽ bọc bằng dấu `backtick` (ví dụ: `backend/models.py`, `get_current_user()`) theo yêu cầu của bạn.

10) Todo & tiến độ
- Tôi sẽ dùng system todo list (nội bộ) để theo dõi các bước lớn; cập nhật trạng thái khi bắt đầu/hoàn thành.

11) Khi không rõ
- Nếu thay đổi có rủi ro (xóa dữ liệu, thay đổi schema, migration), tôi sẽ tạm dừng và hỏi bạn 1 câu rõ ràng trước khi tiếp tục.

12) Sửa đổi file ghi nhớ
- Bạn có thể chỉnh file này trực tiếp; sau khi chỉnh, tôi sẽ load lại và tuân theo nội dung mới.

---
Cảm ơn — nếu đồng ý, tôi sẽ lưu file này vào repository (`COPILOT_RULES.md`) và dùng nó làm chuẩn làm việc. Nếu bạn muốn bổ sung quy tắc nào, hãy chỉnh file hoặc nói trực tiếp (bằng tiếng Việt).