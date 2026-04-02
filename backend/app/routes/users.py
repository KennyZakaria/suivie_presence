from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.user_service import (
    create_teacher, create_student, get_all_teachers, get_all_students,
    get_user_by_id, update_user, delete_user, reset_user_password,
)
from app.models.user import UserUpdate
from app.middleware.auth import require_admin

router = APIRouter(prefix="/users", tags=["users"])


class CreateTeacherRequest(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    password: Optional[str] = None


class CreateStudentRequest(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    password: Optional[str] = None


@router.post("/teachers")
async def create_teacher_endpoint(
    data: CreateTeacherRequest,
    _: dict = Depends(require_admin),
):
    return await create_teacher(data.model_dump())


@router.post("/students")
async def create_student_endpoint(
    data: CreateStudentRequest,
    _: dict = Depends(require_admin),
):
    return await create_student(data.model_dump())


@router.get("/teachers")
async def list_teachers(_: dict = Depends(require_admin)):
    return await get_all_teachers()


@router.get("/students")
async def list_students(_: dict = Depends(require_admin)):
    return await get_all_students()


@router.get("/{user_id}")
async def get_user(user_id: str, _: dict = Depends(require_admin)):
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {k: v for k, v in user.items() if k != "password_hash"}


@router.put("/{user_id}")
async def update_user_endpoint(
    user_id: str,
    data: UserUpdate,
    _: dict = Depends(require_admin),
):
    return await update_user(user_id, data)


@router.delete("/{user_id}")
async def delete_user_endpoint(user_id: str, _: dict = Depends(require_admin)):
    await delete_user(user_id)
    return {"message": "User deleted"}


@router.post("/{user_id}/reset-password")
async def reset_password_endpoint(user_id: str, _: dict = Depends(require_admin)):
    return await reset_user_password(user_id)
