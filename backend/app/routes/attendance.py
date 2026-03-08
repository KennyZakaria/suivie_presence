from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.services.attendance_service import (
    mark_attendance, get_attendance_by_class_date, get_attendance_by_student,
    get_attendance_summary_by_student, update_attendance_record,
    get_attendance_report_by_class,
)
from app.models.attendance import BulkAttendanceCreate, AttendanceUpdate
from app.middleware.auth import get_current_user, require_teacher

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/bulk")
async def bulk_mark_attendance(
    data: BulkAttendanceCreate,
    current_user: dict = Depends(require_teacher),
):
    results = await mark_attendance(data, current_user["id"])

    # Send notifications to absent students
    from app.services.notification_service import send_notification
    for record in results:
        if record.get("status") == "absent":
            await send_notification(
                record["student_id"],
                "Attendance Alert",
                f"You were marked absent on {record['date']}",
                {"type": "attendance", "ref_id": record["id"]},
            )
    return results


@router.get("/class/{class_id}")
async def get_class_attendance(
    class_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    _: dict = Depends(get_current_user),
):
    return await get_attendance_by_class_date(class_id, date)


@router.get("/student/{student_id}/summary")
async def get_student_summary(
    student_id: str,
    _: dict = Depends(get_current_user),
):
    return await get_attendance_summary_by_student(student_id)


@router.get("/student/{student_id}")
async def get_student_attendance(
    student_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    _: dict = Depends(get_current_user),
):
    return await get_attendance_by_student(student_id, start_date, end_date)


@router.put("/{record_id}")
async def update_record(
    record_id: str,
    data: AttendanceUpdate,
    _: dict = Depends(require_teacher),
):
    return await update_attendance_record(record_id, data)


@router.get("/report/class/{class_id}")
async def get_class_report(
    class_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    _: dict = Depends(get_current_user),
):
    return await get_attendance_report_by_class(class_id, start_date, end_date)
