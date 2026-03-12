from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    student_id: str = Field(max_length=11, min_length=11)
    password: str = Field(...,min_length=6)
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(BaseModel):
    id: int
    student_id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    is_banned: bool
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    student_id: str
    password: str

class PostMediaResponse(BaseModel):
    id: int
    post_id: int
    file_url: str
    file_name: str
    file_size: int
    media_type: str
    mime_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str
    is_anonymous: bool = False

class PostResponse(BaseModel):
    id: int
    author_id: int
    content: str
    is_anonymous: bool = False
    created_at: datetime
    author: Optional[UserResponse] = None
    like_count: int = 0
    comment_count: int = 0
    user_liked: bool = False
    media: List[PostMediaResponse] = []

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    user: Optional[UserResponse] = None
    like_count: int = 0
    user_liked: bool = False
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True

class InteractionCreate(BaseModel):
    interaction_type: str = "like"

class InteractionResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    interaction_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class CommentInteractionCreate(BaseModel):
    interaction_type: str = "like"

class CommentInteractionResponse(BaseModel):
    id: int
    user_id: int
    comment_id: int
    interaction_type: str
    created_at: datetime

    class Config:
        from_attributes = True



