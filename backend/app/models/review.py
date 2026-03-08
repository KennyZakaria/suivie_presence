from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ReviewLevel(int, Enum):
    warning = 1
    parent_contact = 2
    suspension = 3


class ReviewBase(BaseModel):
    student_id: str
    class_id: str
    level: ReviewLevel
    title: str
    description: str
    date: str  # YYYY-MM-DD


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    id: str
    teacher_id: str
    is_resolved: bool = False
    resolved_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
