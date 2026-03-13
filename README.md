# 🎓 DTU Confession

Nền tảng confession ẩn danh dành cho sinh viên Đại học Duy Tân (DTU). Chia sẻ tâm sự, câu chuyện và kết nối cộng đồng.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## 🛠️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 19 + Vite 7 + Tailwind CSS v4 + Motion |
| **Backend** | FastAPI + SQLAlchemy + Pydantic |
| **Database** | PostgreSQL 15 |
| **Auth** | JWT (python-jose + bcrypt) |
| **Deploy** | Docker + Nginx |

## 🚀 Chạy với Docker

Cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/),.

```bash
# 1. Clone project
git clone https://github.com/nguyenvphihung/dtu-confessions.git
cd dtu-confessions

# 2. Tạo file cấu hình backend
cp backend/.env.example backend/.env

# 3. Chạy
docker-compose up --build
```

Truy cập **http://localhost:3000** — Đăng ký tài khoản và bắt đầu sử dụng!

> **Nếu trùng port đang có ở máy** Chạy `cp .env.example .env`, đổi port:
> ```ini
> APP_PORT=3001
> API_PORT=8001
> DB_PORT=5434
> ```
> Rồi chạy lại `docker-compose up --build`, truy cập `http://localhost:{APP_PORT}`


## 💻 Chạy Development (Local)

### Yêu cầu
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend

# Tạo virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Cài dependencies
pip install -r requirements.txt

# Cấu hình
cp .env.example .env
# Sửa .env cho đúng thông tin database của bạn

# Chạy
uvicorn main:app --reload
```

Backend chạy tại **http://localhost:8000** | API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại **http://localhost:5173**

## 🌱 Seed Dữ liệu Mẫu (Tùy chọn)

Dự án cung cấp bộ công cụ để tự động tạo dữ liệu mẫu với hiệu suất cao (users, posts, comments, interactions...) và gán ảnh ngẫu nhiên cho bài viết nhằm mục đích test.

**1. Nếu bạn chạy bằng Docker:**
```bash
# Truy cập vào container backend
docker exec -it <tên_container_backend> /bin/bash
# Ví dụ: docker exec -it dtuconfessions-backend-1 /bin/bash

# Chạy script tạo dữ liệu (mặc định sẽ tạo lượng lớn data, có thể mất vài chục giây)
python seed_fake_data.py

# (Tùy chọn) Chạy lệnh với số lượng nhỏ hơn để test nhanh:
# python seed_fake_data.py --users 500 --posts 2000 --comments 5000 --post_likes 3000 --comment_likes 2000

# Chạy script gán URL ảnh ngẫu nhiên (từ picsum.photos) cho khoảng 70% bài viết chưa có ảnh
python seed_fake_images.py
```

**2. Nếu bạn chạy Development (Local):**
Đảm bảo bạn đang ở trong thư mục `backend` và đã kích hoạt môi trường ảo (`.venv`):
```bash
cd backend

# Chạy tạo dữ liệu text
python seed_fake_data.py

# Chạy tạo dữ liệu ảnh 
python seed_fake_images.py
```

## 📁 Cấu trúc dự án

```
dtu-confessions/
├── docker-compose.yml          # Docker orchestration
├── backend/
│   ├── Dockerfile
│   ├── main.py                 # FastAPI app
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── database.py             # Database connection
│   ├── auth.py                 # JWT authentication
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── auth.py             # Đăng ký, đăng nhập
│       ├── posts.py            # CRUD bài viết
│       ├── comments.py         # CRUD bình luận
│       ├── interactions.py     # Like/unlike
│       ├── media.py            # Upload file
│       ├── users.py            # Thông tin user
│       ├── admin.py            # Quản trị
│       └── stats.py            # Thống kê
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # Nginx config (production)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/                # Axios API calls
        ├── components/         # React components
        ├── context/            # Auth & Theme context
        └── pages/              # Page components
```
