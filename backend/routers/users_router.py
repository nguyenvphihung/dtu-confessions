from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return user

@router.put("/me", response_model=schemas.UserResponse)
def update_my_profile(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # If changing email, require OTP
    if user_update.email is not None and user_update.email != current_user.email:
        otp = db.query(models.OTPVerification).filter(
            models.OTPVerification.email == user_update.email, # Should be sent to NOT the current email but the NEW email to verify ownership? 
            # Actually, usually OTP is sent to current email to AUTHORIZE change. 
            # The prompt says "if want to change important info like email or password, must send OTP to email".
            # I'll assume it sends to CURRENT email for authorization.
            models.OTPVerification.email == current_user.email, 
            models.OTPVerification.purpose == "change_email",
            models.OTPVerification.is_verified == True
        ).first()
        if not otp:
            raise HTTPException(status_code=400, detail="Vui lòng xác thực OTP gửi tới email hiện tại của bạn")
        
        # Check if new email is already taken
        existing_email = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email mới này đã được sử dụng")
            
        current_user.email = user_update.email
        db.delete(otp) # Cleanup

    # If changing password, require OTP
    if user_update.password is not None:
        otp = db.query(models.OTPVerification).filter(
            models.OTPVerification.email == current_user.email,
            models.OTPVerification.purpose == "change_password",
            models.OTPVerification.is_verified == True
        ).first()
        if not otp:
            raise HTTPException(status_code=400, detail="Vui lòng xác thực OTP gửi tới email hiện tại của bạn để đổi mật khẩu")
        
        from auth import hash_password
        current_user.password_hash = hash_password(user_update.password)
        db.delete(otp) # Cleanup

    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
        
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.cover_url is not None:
        current_user.cover_url = user_update.cover_url
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user