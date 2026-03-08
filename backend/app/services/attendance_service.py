from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException
from app.utils.firebase import get_db
from app.models.attendance import BulkAttendanceCreate, AttendanceUpdate, AttendanceSummary
import uuid


async def mark_attendance(data: BulkAttendanceCreate, teacher_id: str) -> List[dict]:
    db = get_db()
    results = []
    now = datetime.utcnow().isoformat()

    for record in data.records:
        # Check if attendance already exists for this student/class/date
        existing = (
            db.collection("attendance")
            .where("class_id", "==", data.class_id)
            .where("student_id", "==", record.student_id)
            .where("date", "==", data.date)
            .get()
        )

        att_data = {
            "class_id": data.class_id,
            "student_id": record.student_id,
            "teacher_id": teacher_id,
            "date": data.date,
            "status": record.status.value,
            "notes": record.notes,
            "updated_at": now,
        }

        if existing:
            doc_id = existing[0].id
            db.collection("attendance").document(doc_id).update(att_data)
            att_data["id"] = doc_id
            att_data["created_at"] = existing[0].to_dict().get("created_at", now)
        else:
            att_id = str(uuid.uuid4())
            att_data["id"] = att_id
            att_data["created_at"] = now
            db.collection("attendance").document(att_id).set(att_data)

        results.append(att_data)

    return results


async def get_attendance_by_class_date(class_id: str, date: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("attendance")
        .where("class_id", "==", class_id)
        .where("date", "==", date)
        .get()
    )
    result = []
    for doc in docs:
        att = doc.to_dict()
        att["id"] = doc.id
        result.append(att)
    return result


async def get_attendance_by_student(
    student_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    query = db.collection("attendance").where("student_id", "==", student_id)
    if start_date:
        query = query.where("date", ">=", start_date)
    if end_date:
        query = query.where("date", "<=", end_date)

    docs = query.order_by("date", direction="DESCENDING").get()
    result = []
    for doc in docs:
        att = doc.to_dict()
        att["id"] = doc.id
        result.append(att)
    return result


async def get_attendance_summary_by_student(student_id: str) -> AttendanceSummary:
    db = get_db()
    docs = db.collection("attendance").where("student_id", "==", student_id).get()

    total = 0
    present = 0
    absent = 0
    late = 0

    for doc in docs:
        att = doc.to_dict()
        total += 1
        s = att.get("status", "")
        if s == "present":
            present += 1
        elif s == "absent":
            absent += 1
        elif s == "late":
            late += 1

    def pct(n):
        return round((n / total * 100), 2) if total > 0 else 0.0

    return AttendanceSummary(
        student_id=student_id,
        total=total,
        present=present,
        absent=absent,
        late=late,
        present_percentage=pct(present),
        absent_percentage=pct(absent),
        late_percentage=pct(late),
    )


async def get_attendance_report_by_class(
    class_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    query = db.collection("attendance").where("class_id", "==", class_id)
    if start_date:
        query = query.where("date", ">=", start_date)
    if end_date:
        query = query.where("date", "<=", end_date)

    docs = query.order_by("date").get()
    result = []
    for doc in docs:
        att = doc.to_dict()
        att["id"] = doc.id
        result.append(att)
    return result


async def update_attendance_record(record_id: str, data: AttendanceUpdate) -> dict:
    db = get_db()
    doc = db.collection("attendance").document(record_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    update_data["updated_at"] = datetime.utcnow().isoformat()
    db.collection("attendance").document(record_id).update(update_data)

    updated = db.collection("attendance").document(record_id).get().to_dict()
    updated["id"] = record_id
    return updated
