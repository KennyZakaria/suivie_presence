from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class NotificationBase(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = {}


class NotificationCreate(NotificationBase):
    user_id: str


class NotificationResponse(NotificationBase):
    id: str
    user_id: str
    is_read: bool = False
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
