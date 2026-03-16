from enum import Enum
from typing import Optional
from pydantic import BaseModel


class JustificationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class JustificationReview(BaseModel):
    status: JustificationStatus
    admin_comment: Optional[str] = None


class JustificationResponse(BaseModel):
    id: str
    student_id: str
    attendance_id: str
    reason: str
    document_url: Optional[str] = None
    status: JustificationStatus = JustificationStatus.pending
    admin_comment: Optional[str] = None
    created_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    # Joined fields
    student_name: Optional[str] = None
    date: Optional[str] = None
    class_id: Optional[str] = None

    class Config:
        from_attributes = True
