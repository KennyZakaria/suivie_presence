from fastapi import APIRouter, Depends, Query
from app.services.analytics_service import (
    get_dashboard_summary, get_attendance_trends,
    get_class_attendance_comparison, get_at_risk_students,
    get_review_stats_by_level, clear_analytics_cache,
)
from app.middleware.auth import require_admin

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard_summary(_: dict = Depends(require_admin)):
    return await get_dashboard_summary()


@router.get("/attendance-trends")
async def attendance_trends(
    days: int = Query(30, ge=7, le=90),
    _: dict = Depends(require_admin),
):
    return await get_attendance_trends(days)


@router.get("/class-comparison")
async def class_comparison(_: dict = Depends(require_admin)):
    return await get_class_attendance_comparison()


@router.get("/at-risk-students")
async def at_risk_students(
    threshold: float = Query(70.0),
    _: dict = Depends(require_admin),
):
    return await get_at_risk_students(threshold)


@router.get("/review-stats")
async def review_stats(_: dict = Depends(require_admin)):
    return await get_review_stats_by_level()


@router.post("/clear-cache")
async def clear_cache(_: dict = Depends(require_admin)):
    """Clear analytics cache - call this after bulk data updates"""
    clear_analytics_cache()
    return {"message": "Cache cleared successfully"}
