from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ReviewLevel(int, Enum):
    warning = 1
    parent_contact = 2
    suspension = 3


class ReviewType(str, Enum):
    comment = "comment"
    conseil_discipline = "conseil_discipline"


class ReviewSentiment(str, Enum):
    positive = "positive"
    negative = "negative"


# Used by teachers to leave a positive or negative comment
class CommentCreate(BaseModel):
    student_id: str
    class_id: str
    sentiment: ReviewSentiment
    title: str
    description: str
    date: str  # YYYY-MM-DD


# Used by admins to create a formal disciplinary council entry
class ConseilDisciplineCreate(BaseModel):
    student_id: str
    class_id: str
    level: ReviewLevel
    title: str
    description: str
    date: str  # YYYY-MM-DD


# Keep for backward compat
class ReviewCreate(BaseModel):
    student_id: str
    class_id: str
    level: Optional[ReviewLevel] = None
    sentiment: Optional[ReviewSentiment] = None
    review_type: ReviewType = ReviewType.comment
    title: str
    description: str
    date: str


class ReviewResponse(BaseModel):
    id: str
    student_id: str
    class_id: str
    teacher_id: str
    review_type: str = "conseil_discipline"
    level: Optional[int] = None
    sentiment: Optional[str] = None
    title: str
    description: str
    date: str
    is_resolved: bool = False
    resolved_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
