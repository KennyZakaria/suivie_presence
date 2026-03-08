from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException
from app.utils.firebase import get_db
from app.models.class_model import ClassCreate, ClassUpdate
import uuid


async def create_class(data: ClassCreate) -> dict:
    db = get_db()
    class_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    schedule = data.schedule.model_dump() if data.schedule else {}
    class_data = {
        "id": class_id,
        "name": data.name,
        "subject": data.subject,
        "grade": data.grade,
        "teacher_id": None,
        "student_ids": [],
        "schedule": schedule,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("classes").document(class_id).set(class_data)
    return class_data


async def get_class_by_id(class_id: str) -> Optional[dict]:
    db = get_db()
    doc = db.collection("classes").document(class_id).get()
    if not doc.exists:
        return None
    cls = doc.to_dict()
    cls["id"] = doc.id
    return cls


async def get_all_classes() -> List[dict]:
    db = get_db()
    docs = db.collection("classes").where("is_active", "==", True).get()
    result = []
    for doc in docs:
        cls = doc.to_dict()
        cls["id"] = doc.id
        result.append(cls)
    return result


async def update_class(class_id: str, data: ClassUpdate) -> dict:
    db = get_db()
    doc = db.collection("classes").document(class_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "schedule" in update_data and update_data["schedule"]:
        update_data["schedule"] = update_data["schedule"]
    update_data["updated_at"] = datetime.utcnow().isoformat()
    db.collection("classes").document(class_id).update(update_data)

    updated = db.collection("classes").document(class_id).get().to_dict()
    updated["id"] = class_id
    return updated


async def assign_teacher_to_class(class_id: str, teacher_id: str) -> dict:
    db = get_db()
    class_doc = db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    teacher_doc = db.collection("users").document(teacher_id).get()
    if not teacher_doc.exists:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db.collection("classes").document(class_id).update({
        "teacher_id": teacher_id,
        "updated_at": datetime.utcnow().isoformat(),
    })

    # Add class to teacher's class_ids
    teacher_data = teacher_doc.to_dict()
    class_ids = teacher_data.get("class_ids", [])
    if class_id not in class_ids:
        class_ids.append(class_id)
        db.collection("users").document(teacher_id).update({"class_ids": class_ids})

    updated = db.collection("classes").document(class_id).get().to_dict()
    updated["id"] = class_id
    return updated


async def assign_students_to_class(class_id: str, student_ids: List[str]) -> dict:
    db = get_db()
    class_doc = db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    class_data = class_doc.to_dict()
    existing_students = class_data.get("student_ids", [])
    merged = list(set(existing_students + student_ids))

    db.collection("classes").document(class_id).update({
        "student_ids": merged,
        "updated_at": datetime.utcnow().isoformat(),
    })

    # Update each student's class_ids
    for sid in student_ids:
        student_doc = db.collection("users").document(sid).get()
        if student_doc.exists:
            s_data = student_doc.to_dict()
            s_class_ids = s_data.get("class_ids", [])
            if class_id not in s_class_ids:
                s_class_ids.append(class_id)
                db.collection("users").document(sid).update({"class_ids": s_class_ids})

    updated = db.collection("classes").document(class_id).get().to_dict()
    updated["id"] = class_id
    return updated


async def remove_student_from_class(class_id: str, student_id: str) -> bool:
    db = get_db()
    class_doc = db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    class_data = class_doc.to_dict()
    student_ids = [s for s in class_data.get("student_ids", []) if s != student_id]
    db.collection("classes").document(class_id).update({
        "student_ids": student_ids,
        "updated_at": datetime.utcnow().isoformat(),
    })

    # Remove class from student's class_ids
    student_doc = db.collection("users").document(student_id).get()
    if student_doc.exists:
        s_data = student_doc.to_dict()
        s_class_ids = [c for c in s_data.get("class_ids", []) if c != class_id]
        db.collection("users").document(student_id).update({"class_ids": s_class_ids})

    return True


async def get_classes_by_teacher(teacher_id: str) -> List[dict]:
    db = get_db()
    docs = db.collection("classes").where("teacher_id", "==", teacher_id).get()
    result = []
    for doc in docs:
        cls = doc.to_dict()
        cls["id"] = doc.id
        result.append(cls)
    return result


async def get_classes_by_student(student_id: str) -> List[dict]:
    db = get_db()
    docs = db.collection("classes").where("student_ids", "array_contains", student_id).get()
    result = []
    for doc in docs:
        cls = doc.to_dict()
        cls["id"] = doc.id
        result.append(cls)
    return result


async def get_students_in_class(class_id: str) -> List[dict]:
    db = get_db()
    class_doc = db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    class_data = class_doc.to_dict()
    student_ids = class_data.get("student_ids", [])
    students = []
    for sid in student_ids:
        doc = db.collection("users").document(sid).get()
        if doc.exists:
            user = doc.to_dict()
            user["id"] = doc.id
            students.append({k: v for k, v in user.items() if k != "password_hash"})
    return students
