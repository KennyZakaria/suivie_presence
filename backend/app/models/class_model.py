from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class Schedule(BaseModel):
    days: List[str] = []
    time: Optional[str] = None


class ClassBase(BaseModel):
    name: str
    subject: str
    grade: str
    schedule: Optional[Schedule] = None


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    schedule: Optional[Schedule] = None
    is_active: Optional[bool] = None


class ClassResponse(ClassBase):
    id: str
    teacher_id: Optional[str] = None
    student_ids: List[str] = []
    is_active: bool = True
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
