from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRole(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    class_ids: List[str] = []
    is_active: bool = True
    must_change_password: bool = False
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    password_hash: str
    fcm_token: Optional[str] = None
