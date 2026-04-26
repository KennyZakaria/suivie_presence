from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.auth_service import login_user, change_password, force_change_password
from app.services.user_service import update_fcm_token
from app.services.activity_service import record_logout
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForceChangePasswordRequest(BaseModel):
    new_password: str


class FCMTokenRequest(BaseModel):
    fcm_token: str


class LogoutRequest(BaseModel):
    session_id: str


@router.post("/login")
async def login(data: LoginRequest):
    return await login_user(data.email, data.password)


@router.post("/logout")
async def logout(data: LogoutRequest, current_user: dict = Depends(get_current_user)):
    await record_logout(current_user["id"], data.session_id)
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}


@router.post("/change-password")
async def change_pw(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    await change_password(current_user["id"], data.old_password, data.new_password)
    return {"message": "Password changed successfully"}


@router.post("/force-change-password")
async def force_change_pw(
    data: ForceChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    await force_change_password(current_user["id"], data.new_password)
    return {"message": "Password changed successfully"}


@router.put("/fcm-token")
async def update_fcm(
    data: FCMTokenRequest,
    current_user: dict = Depends(get_current_user),
):
    await update_fcm_token(current_user["id"], data.fcm_token)
    return {"message": "FCM token updated"}
