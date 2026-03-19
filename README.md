# 🎓 DTU Confession

Nền tảng confession ẩn danh hiện đại dành cho sinh viên Đại học Duy Tân (DTU). Chia sẻ tâm sự, video Reels bí mật và kết nối cộng đồng một cách chuyên nghiệp.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)


## 🛠️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 19 + Vite 7 + Tailwind CSS v4 + Motion (Framer) |
| **Backend** | FastAPI + SQLAlchemy + Pydantic + Alembic |
| **Database** | PostgreSQL 15 |
| **Object Storage** | MinIO (Phục vụ lưu trữ Avatar, Media) |
| **Visualization** | Recharts (Dashboard báo cáo) |
| **Auth** | JWT (HttpOnly Cookies Security) |

## 🚀 Cài đặt dự án

### 1. Chạy với Docker (Khuyên dùng)

Đảm bảo bạn đã cài [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Clone project
git clone https://github.com/nguyenvphihung/dtu-confessions.git
cd dtu-confessions

# 2. Tạo cấu hình .env (Backend & MinIO)
cp backend/.env.example backend/.env

# 3. Khởi động toàn bộ hệ thống (Postgres, MinIO, Backend, Frontend)
docker-compose up --build
```
Truy cập:
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

### 2. Chạy Development (Local)

#### Backend (Python 3.11+)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env # Cấu hình DATABASE_URL và MINIO_KEY
uvicorn main:app --reload
```

#### Frontend (Node.js 20+)
```bash
cd frontend
npm install
npm run dev
```

## 📁 Cấu trúc dự án

```
dtu-confessions/
├── backend/
│   ├── main.py                 # FastAPI Gateway
│   ├── models.py               # Database Models (is_private, shared_post_id...)
│   ├── routers/                # API Endpoints (Admin, Posts, Media, Stats, Reels...)
│   └── alembic/                # Database Migrations
└── frontend/
    └── src/
        ├── api/                # Axios Services
        ├── components/         # Common UI Components (PostCard, Sidebar, AdminLayout...)
        ├── pages/              # 
        │   ├── admin/          # Admin Sub-pages (Users, Posts, Reports)
        │   └── ...             # Feed, Reels, Profile...
        └── context/            # Auth & Theme System
```

## 🛡️ Admin Panel
Để truy cập giao diện quản trị, bạn cần đăng nhập với tài khoản Admin và truy cập đường dẫn trực tiếp: `http://localhost:5173/admin`. Giao diện hỗ trợ quản lý người dùng, bài viết và xem biểu đồ báo cáo thời gian thực.

---
Phát triển bởi [nguyenvphihung](https://github.com/nguyenvphihung) 🚀
