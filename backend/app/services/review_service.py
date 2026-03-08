from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from app.utils.firebase import get_db
from app.models.review import ReviewCreate
import uuid


async def create_review(data: ReviewCreate, teacher_id: str) -> dict:
    db = get_db()
    review_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    review_data = {
        "id": review_id,
        "student_id": data.student_id,
        "teacher_id": teacher_id,
        "class_id": data.class_id,
        "level": data.level.value,
        "title": data.title,
        "description": data.description,
        "date": data.date,
        "is_resolved": False,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("reviews").document(review_id).set(review_data)
    return review_data


async def get_reviews_by_student(student_id: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("reviews")
        .where("student_id", "==", student_id)
        .order_by("created_at", direction="DESCENDING")
        .get()
    )
    result = []
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        result.append(r)
    return result


async def get_reviews_by_teacher(teacher_id: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("reviews")
        .where("teacher_id", "==", teacher_id)
        .order_by("created_at", direction="DESCENDING")
        .get()
    )
    result = []
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        result.append(r)
    return result


async def get_reviews_by_class(class_id: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("reviews")
        .where("class_id", "==", class_id)
        .order_by("created_at", direction="DESCENDING")
        .get()
    )
    result = []
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        result.append(r)
    return result


async def get_all_reviews() -> List[dict]:
    db = get_db()
    docs = db.collection("reviews").order_by("created_at", direction="DESCENDING").get()
    result = []
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        result.append(r)
    return result


async def resolve_review(review_id: str) -> dict:
    db = get_db()
    doc = db.collection("reviews").document(review_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Review not found")

    now = datetime.utcnow().isoformat()
    db.collection("reviews").document(review_id).update({
        "is_resolved": True,
        "resolved_at": now,
        "updated_at": now,
    })
    updated = db.collection("reviews").document(review_id).get().to_dict()
    updated["id"] = review_id
    return updated


async def get_review_stats() -> dict:
    db = get_db()
    docs = db.collection("reviews").get()
    stats = {1: 0, 2: 0, 3: 0, "total": 0, "resolved": 0, "open": 0}
    for doc in docs:
        r = doc.to_dict()
        level = r.get("level", 1)
        stats[level] = stats.get(level, 0) + 1
        stats["total"] += 1
        if r.get("is_resolved"):
            stats["resolved"] += 1
        else:
            stats["open"] += 1
    return stats
