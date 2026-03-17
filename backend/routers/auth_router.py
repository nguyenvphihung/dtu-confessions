from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token, create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES
import os
from jose import jwt
import models
import schemas

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.student_id == user_data.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID đã tồn tại")
        
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    
    new_user = models.User(
        student_id = user_data.student_id,
        display_name = user_data.display_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.UserResponse)
def login(login_data: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.student_id == login_data.student_id).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Student ID hoặc mật khẩu không đúng")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Cookie options
    max_age = None
    if login_data.remember:
        # persistent cookies: use refresh token expiry; access token expiry use minutes
        max_age = 60 * 60 * 24 * int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', 7))

    # Set HttpOnly cookies
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=60*ACCESS_TOKEN_EXPIRE_MINUTES)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax", max_age=max_age)

    # Return user object (not tokens)
    return user


@router.post('/refresh', response_model=schemas.Token)
def refresh_tokens(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh = request.cookies.get('refresh_token')
    if not refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    try:
        payload = jwt.decode(refresh, os.getenv('SECRET_KEY'), algorithms=[os.getenv('ALGORITHM', 'HS256')])
        user_id = int(payload.get('sub'))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(data={"sub": str(user.id)})
    response.set_cookie(key="access_token", value=new_access, httponly=True, secure=True, samesite="lax", max_age=60*ACCESS_TOKEN_EXPIRE_MINUTES)
    return {"access_token": new_access, "token_type": "bearer"}


@router.post('/logout')
def logout(response: Response):
    # Clear cookies
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return {"detail": "Logged out"}