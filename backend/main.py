from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from database import engine
import models
import os
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

from routers import (
    users_router, posts_router, comments_router, 
    interactions_router, auth_router, media_router, 
    admin_router, stats_router, reels_router, 
    reports_router, notifications_router
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DTU Confession, version 1.0.0")

def _error_response(code: str, message: str, details=None):
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=_error_response(
            code="VALIDATION_ERROR",
            message="Dữ liệu không hợp lệ",
            details=exc.errors()
        )
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = f"HTTP_{exc.status_code}"
    message = exc.detail if isinstance(exc.detail, str) else "Yêu cầu không hợp lệ"
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_response(code=code, message=message)
    )

@app.exception_handler(Exception)
async def internal_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="Đã xảy ra lỗi hệ thống"
        )
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(posts_router.router)
app.include_router(comments_router.router)
app.include_router(interactions_router.router)
app.include_router(media_router.router)
app.include_router(admin_router.router)
app.include_router(stats_router.router)
app.include_router(reels_router.router)
app.include_router(reports_router.router)
app.include_router(notifications_router.router)


@app.get("/")
def read_root():
    return {"status": "success", "message": "DTU Confession API is running!"}
