from enum import Enum
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"


class AttendanceRecord(BaseModel):
    student_id: str
    status: AttendanceStatus
    notes: Optional[str] = None


class AttendanceCreate(BaseModel):
    class_id: str
    student_id: str
    teacher_id: str
    date: str  # YYYY-MM-DD
    status: AttendanceStatus
    notes: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    class_id: str
    date: str  # YYYY-MM-DD
    records: List[AttendanceRecord]


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    teacher_id: str
    date: str
    status: AttendanceStatus
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    student_id: str
    total: int
    present: int
    absent: int
    late: int
    present_percentage: float
    absent_percentage: float
    late_percentage: float
