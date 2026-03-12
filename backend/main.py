from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
import os
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

from routers import users, posts, comments, interactions, auth, media, admin, stats

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DTU Confession, version 1.0.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[FASTAPI VALIDATION ERROR] {exc.errors()}")
    print(f"[FASTAPI VALIDATION BODY] {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(interactions.router)
app.include_router(media.router)
app.include_router(admin.router)
app.include_router(stats.router)


@app.get("/")
def read_root():
    return {"status": "success", "message": "DTU Confession API is running!"}

