# Alembic Migration Guide

## Cấu trúc chuẩn

- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/script.py.mako`
- `backend/alembic/versions/*.py`

## Khởi tạo môi trường

```bash
cd backend
pip install -r requirements.txt
```

## Tạo migration mới

```bash
alembic revision --autogenerate -m "add_xxx_table"
```

## Chạy upgrade và downgrade

```bash
alembic upgrade head
alembic downgrade -1
alembic downgrade 20260317_0001
```

## Đồng bộ nhiều developer và xử lý conflict

### Trường hợp nhiều revision song song

```bash
alembic heads
alembic merge -m "merge_heads" <head_a> <head_b>
```

### Quy trình khuyến nghị khi làm việc nhóm

1. Pull branch mới nhất trước khi tạo revision.
2. Chỉ tạo một revision cho một thay đổi schema logic.
3. Push revision cùng code thay đổi model trong cùng một PR.
4. Nếu gặp nhiều head thì tạo merge revision trước khi release.

## Best practices

- Tên revision message theo dạng động từ + đối tượng: `add_reel_views_table`.
- Mỗi migration có docstring rõ: mục tiêu thay đổi và ảnh hưởng.
- Không chỉnh sửa migration đã chạy production; tạo migration mới để sửa.
- Kiểm tra `upgrade` và `downgrade` đều chạy được trên môi trường local.
- Với schema lớn, ưu tiên tách migration nhỏ thay vì một revision quá lớn.

## Gợi ý chuẩn docstring migration

```python
"""add index for faster reel lookup

Revision ID: 20260317_0002
Revises: 20260317_0001
Create Date: 2026-03-17 10:00:00
"""
```
