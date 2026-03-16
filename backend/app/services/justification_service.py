import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, UploadFile
from firebase_admin import storage
from app.utils.firebase import get_db
from app.models.justification import JustificationStatus


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def create_justification(
    student_id: str,
    attendance_id: str,
    reason: str,
    file: Optional[UploadFile] = None,
) -> dict:
    db = get_db()

    # Verify the attendance record exists and belongs to this student
    att_doc = db.collection("attendance").document(attendance_id).get()
    if not att_doc.exists:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    att = att_doc.to_dict()
    if att.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="Not your attendance record")
    if att.get("status") != "absent":
        raise HTTPException(status_code=400, detail="Only absences can be justified")

    # Check for existing justification
    existing = (
        db.collection("justifications")
        .where("attendance_id", "==", attendance_id)
        .limit(1)
        .get()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Justification already submitted for this absence")

    document_url = None
    if file:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="File type not allowed. Use JPEG, PNG, WebP, or PDF.")
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum 5 MB.")

        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
        blob_name = f"justifications/{student_id}/{uuid.uuid4().hex}.{ext}"
        bucket = storage.bucket()
        blob = bucket.blob(blob_name)
        blob.upload_from_string(content, content_type=file.content_type)
        blob.make_public()
        document_url = blob.public_url

    now = datetime.utcnow().isoformat()
    justification_id = str(uuid.uuid4())
    data = {
        "id": justification_id,
        "student_id": student_id,
        "attendance_id": attendance_id,
        "reason": reason,
        "document_url": document_url,
        "status": JustificationStatus.pending.value,
        "admin_comment": None,
        "created_at": now,
        "reviewed_at": None,
        "reviewed_by": None,
    }
    db.collection("justifications").document(justification_id).set(data)
    return data


async def get_justifications(status_filter: Optional[str] = None) -> List[dict]:
    db = get_db()
    query = db.collection("justifications")
    if status_filter:
        query = query.where("status", "==", status_filter)
    docs = query.get()

    results = []
    for doc in docs:
        j = doc.to_dict()
        j["id"] = doc.id
        # Join student name and attendance date
        student_doc = db.collection("users").document(j["student_id"]).get()
        if student_doc.exists:
            j["student_name"] = student_doc.to_dict().get("full_name", "")
        att_doc = db.collection("attendance").document(j["attendance_id"]).get()
        if att_doc.exists:
            att = att_doc.to_dict()
            j["date"] = att.get("date", "")
            j["class_id"] = att.get("class_id", "")
        results.append(j)
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


async def get_student_justifications(student_id: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("justifications")
        .where("student_id", "==", student_id)
        .get()
    )
    results = []
    for doc in docs:
        j = doc.to_dict()
        j["id"] = doc.id
        att_doc = db.collection("attendance").document(j["attendance_id"]).get()
        if att_doc.exists:
            att = att_doc.to_dict()
            j["date"] = att.get("date", "")
            j["class_id"] = att.get("class_id", "")
        results.append(j)
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


async def review_justification(
    justification_id: str,
    status: JustificationStatus,
    admin_id: str,
    admin_comment: Optional[str] = None,
) -> dict:
    db = get_db()
    doc = db.collection("justifications").document(justification_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Justification not found")

    j = doc.to_dict()
    if j.get("status") != JustificationStatus.pending.value:
        raise HTTPException(status_code=400, detail="Justification already reviewed")

    now = datetime.utcnow().isoformat()
    update = {
        "status": status.value,
        "admin_comment": admin_comment,
        "reviewed_at": now,
        "reviewed_by": admin_id,
    }
    db.collection("justifications").document(justification_id).update(update)

    # If accepted, mark attendance as justified
    if status == JustificationStatus.accepted:
        db.collection("attendance").document(j["attendance_id"]).update(
            {"justified": True}
        )

    updated = db.collection("justifications").document(justification_id).get().to_dict()
    updated["id"] = justification_id
    return updated
