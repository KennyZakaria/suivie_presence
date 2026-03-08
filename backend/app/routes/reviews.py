from fastapi import APIRouter, Depends
from app.services.review_service import (
    create_review, get_all_reviews, get_reviews_by_student,
    get_reviews_by_teacher, resolve_review, get_review_stats,
)
from app.models.review import ReviewCreate
from app.middleware.auth import get_current_user, require_teacher, require_admin

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("")
async def create_review_endpoint(
    data: ReviewCreate,
    current_user: dict = Depends(require_teacher),
):
    review = await create_review(data, current_user["id"])

    # Notify student
    from app.services.notification_service import send_notification
    level_labels = {1: "Warning", 2: "Parent Contact", 3: "Suspension"}
    await send_notification(
        data.student_id,
        f"Disciplinary Review: {level_labels.get(data.level.value, 'Review')}",
        f"{data.title}",
        {"type": "review", "ref_id": review["id"]},
    )
    return review


@router.get("/stats")
async def review_stats(_: dict = Depends(require_admin)):
    return await get_review_stats()


@router.get("/student/{student_id}")
async def student_reviews(
    student_id: str,
    current_user: dict = Depends(get_current_user),
):
    role = current_user.get("role")
    if role == "student" and current_user["id"] != student_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_reviews_by_student(student_id)


@router.get("")
async def list_reviews(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role == "admin":
        return await get_all_reviews()
    elif role == "teacher":
        return await get_reviews_by_teacher(current_user["id"])
    else:
        return await get_reviews_by_student(current_user["id"])


@router.put("/{review_id}/resolve")
async def resolve_review_endpoint(
    review_id: str,
    _: dict = Depends(require_teacher),
):
    return await resolve_review(review_id)
