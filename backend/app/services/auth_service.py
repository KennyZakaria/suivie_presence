from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from passlib.context import CryptContext
from app.utils.firebase import get_db
from app.models.user import UserCreate, UserRole
from app.middleware.auth import create_access_token
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def register_user(user_create: UserCreate) -> dict:
    db = get_db()
    existing = db.collection("users").where("email", "==", user_create.email).get()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    user_data = {
        "id": user_id,
        "email": user_create.email,
        "password_hash": hash_password(user_create.password),
        "full_name": user_create.full_name,
        "role": user_create.role.value,
        "phone": user_create.phone,
        "profile_image_url": user_create.profile_image_url,
        "class_ids": [],
        "is_active": True,
        "must_change_password": user_create.role == UserRole.student,
        "fcm_token": None,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("users").document(user_id).set(user_data)
    return user_data


async def login_user(email: str, password: str) -> dict:
    db = get_db()
    users = db.collection("users").where("email", "==", email).get()
    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    user_doc = users[0]
    user = user_doc.to_dict()
    user["id"] = user_doc.id

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password_hash"}

    # Record login activity (fire-and-forget, don't fail login if this errors)
    try:
        from app.services.activity_service import record_activity
        import asyncio
        asyncio.create_task(record_activity(
            user_id=user["id"],
            user_email=user["email"],
            user_role=user["role"],
            action="login",
            session_id=token[:36],  # first 36 chars of JWT as session id
        ))
    except Exception:
        pass

    return {"access_token": token, "token_type": "bearer", "user": user_response, "session_id": token[:36]}


async def change_password(user_id: str, old_password: str, new_password: str) -> bool:
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user = doc.to_dict()
    if not verify_password(old_password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    db.collection("users").document(user_id).update({
        "password_hash": hash_password(new_password),
        "must_change_password": False,
        "updated_at": datetime.utcnow().isoformat(),
    })
    return True


async def force_change_password(user_id: str, new_password: str) -> bool:
    db = get_db()
    db.collection("users").document(user_id).update({
        "password_hash": hash_password(new_password),
        "must_change_password": False,
        "updated_at": datetime.utcnow().isoformat(),
    })
    return True
