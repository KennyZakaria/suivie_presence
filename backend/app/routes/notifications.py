from fastapi import APIRouter, Depends
from app.services.notification_service import (
    get_notifications_by_user, mark_notification_read, mark_all_read,
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    return await get_notifications_by_user(current_user["id"])


@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, _: dict = Depends(get_current_user)):
    await mark_notification_read(notif_id)
    return {"message": "Marked as read"}


@router.put("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await mark_all_read(current_user["id"])
    return {"message": "All notifications marked as read"}
