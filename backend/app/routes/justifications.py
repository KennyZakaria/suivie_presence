from typing import Optional
from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from app.services.justification_service import (
    create_justification,
    get_justifications,
    get_student_justifications,
    review_justification,
)
from app.models.justification import JustificationReview
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/justifications", tags=["justifications"])


@router.post("")
async def submit_justification(
    attendance_id: str = Form(...),
    reason: str = Form(...),
    document: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    return await create_justification(
        student_id=current_user["id"],
        attendance_id=attendance_id,
        reason=reason,
        file=document,
    )


@router.get("")
async def list_justifications(
    status: Optional[str] = Query(None),
    _: dict = Depends(require_admin),
):
    return await get_justifications(status_filter=status)


@router.get("/my")
async def my_justifications(
    current_user: dict = Depends(get_current_user),
):
    return await get_student_justifications(current_user["id"])


@router.get("/student/{student_id}")
async def student_justifications(
    student_id: str,
    _: dict = Depends(get_current_user),
):
    return await get_student_justifications(student_id)


@router.put("/{justification_id}/review")
async def review(
    justification_id: str,
    data: JustificationReview,
    current_user: dict = Depends(require_admin),
):
    result = await review_justification(
        justification_id=justification_id,
        status=data.status,
        admin_id=current_user["id"],
        admin_comment=data.admin_comment,
    )

    # Notify the student
    from app.services.notification_service import send_notification
    status_label = "acceptée" if data.status.value == "accepted" else "rejetée"
    await send_notification(
        result["student_id"],
        "Justification " + status_label,
        f"Votre justification a été {status_label}."
        + (f" Commentaire: {data.admin_comment}" if data.admin_comment else ""),
        {"type": "justification", "ref_id": justification_id},
    )

    return result
