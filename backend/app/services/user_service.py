from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from app.utils.firebase import get_db
from app.models.user import UserCreate, UserUpdate, UserRole
from app.services.auth_service import hash_password
import uuid
import secrets
import string


def generate_temp_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        return None
    user = doc.to_dict()
    user["id"] = doc.id
    return user


async def get_user_by_email(email: str) -> Optional[dict]:
    db = get_db()
    users = db.collection("users").where("email", "==", email).get()
    if not users:
        return None
    user = users[0].to_dict()
    user["id"] = users[0].id
    return user


async def create_teacher(data: dict) -> dict:
    db = get_db()
    existing = db.collection("users").where("email", "==", data["email"]).get()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    temp_password = data.pop("password", None) or generate_temp_password()
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    user_data = {
        "id": user_id,
        "email": data["email"],
        "password_hash": hash_password(temp_password),
        "full_name": data["full_name"],
        "role": UserRole.teacher.value,
        "phone": data.get("phone"),
        "profile_image_url": None,
        "class_ids": [],
        "is_active": True,
        "must_change_password": False,
        "fcm_token": None,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("users").document(user_id).set(user_data)
    result = {k: v for k, v in user_data.items() if k != "password_hash"}
    result["temp_password"] = temp_password
    return result


async def create_student(data: dict) -> dict:
    db = get_db()
    existing = db.collection("users").where("email", "==", data["email"]).get()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    temp_password = data.pop("password", None) or generate_temp_password()
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    user_data = {
        "id": user_id,
        "email": data["email"],
        "password_hash": hash_password(temp_password),
        "full_name": data["full_name"],
        "role": UserRole.student.value,
        "phone": data.get("phone"),
        "profile_image_url": None,
        "class_ids": [],
        "is_active": True,
        "must_change_password": True,
        "fcm_token": None,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("users").document(user_id).set(user_data)
    result = {k: v for k, v in user_data.items() if k != "password_hash"}
    result["temp_password"] = temp_password
    return result


async def update_user(user_id: str, data: UserUpdate) -> dict:
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    db.collection("users").document(user_id).update(update_data)

    updated = db.collection("users").document(user_id).get().to_dict()
    updated["id"] = user_id
    return {k: v for k, v in updated.items() if k != "password_hash"}


async def delete_user(user_id: str) -> bool:
    db = get_db()
    db.collection("users").document(user_id).delete()
    return True


async def get_all_teachers() -> List[dict]:
    db = get_db()
    docs = db.collection("users").where("role", "==", "teacher").get()
    result = []
    for doc in docs:
        user = doc.to_dict()
        user["id"] = doc.id
        result.append({k: v for k, v in user.items() if k != "password_hash"})
    return result


async def get_all_students() -> List[dict]:
    db = get_db()
    docs = db.collection("users").where("role", "==", "student").get()
    result = []
    for doc in docs:
        user = doc.to_dict()
        user["id"] = doc.id
        result.append({k: v for k, v in user.items() if k != "password_hash"})
    return result


async def update_fcm_token(user_id: str, token: str) -> bool:
    db = get_db()
    db.collection("users").document(user_id).update({
        "fcm_token": token,
        "updated_at": datetime.utcnow().isoformat(),
    })
    return True
