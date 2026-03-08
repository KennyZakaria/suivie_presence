from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.class_service import (
    create_class, get_class_by_id, get_all_classes, update_class,
    assign_teacher_to_class, assign_students_to_class,
    remove_student_from_class, get_students_in_class,
    get_classes_by_teacher,
)
from app.models.class_model import ClassCreate, ClassUpdate
from app.middleware.auth import require_admin, get_current_user

router = APIRouter(prefix="/classes", tags=["classes"])


class AssignTeacherRequest(BaseModel):
    teacher_id: str


class AssignStudentsRequest(BaseModel):
    student_ids: List[str]


@router.post("")
async def create_class_endpoint(
    data: ClassCreate,
    _: dict = Depends(require_admin),
):
    return await create_class(data)


@router.get("")
async def list_classes(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role == "admin":
        return await get_all_classes()
    elif role == "teacher":
        return await get_classes_by_teacher(current_user["id"])
    else:
        # Student sees their classes
        from app.services.class_service import get_classes_by_student
        return await get_classes_by_student(current_user["id"])


@router.get("/{class_id}")
async def get_class(class_id: str, _: dict = Depends(get_current_user)):
    cls = await get_class_by_id(class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.put("/{class_id}")
async def update_class_endpoint(
    class_id: str,
    data: ClassUpdate,
    _: dict = Depends(require_admin),
):
    return await update_class(class_id, data)


@router.post("/{class_id}/assign-teacher")
async def assign_teacher(
    class_id: str,
    data: AssignTeacherRequest,
    _: dict = Depends(require_admin),
):
    return await assign_teacher_to_class(class_id, data.teacher_id)


@router.post("/{class_id}/assign-students")
async def assign_students(
    class_id: str,
    data: AssignStudentsRequest,
    _: dict = Depends(require_admin),
):
    return await assign_students_to_class(class_id, data.student_ids)


@router.delete("/{class_id}/students/{student_id}")
async def remove_student(
    class_id: str,
    student_id: str,
    _: dict = Depends(require_admin),
):
    await remove_student_from_class(class_id, student_id)
    return {"message": "Student removed from class"}


@router.get("/{class_id}/students")
async def get_class_students(
    class_id: str,
    _: dict = Depends(get_current_user),
):
    return await get_students_in_class(class_id)
