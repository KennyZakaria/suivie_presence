import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.services.activity_service import get_all_activity
from app.middleware.auth import require_admin

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("")
async def list_activity(
    limit: int = Query(200, le=1000),
    _: dict = Depends(require_admin),
):
    return await get_all_activity(limit=limit)


@router.get("/export")
async def export_activity_csv(
    limit: int = Query(1000, le=5000),
    _: dict = Depends(require_admin),
):
    records = await get_all_activity(limit=limit)

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["timestamp", "user_email", "user_role", "action", "session_id", "duration_seconds", "ip_address"],
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(records)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activity_log.csv"},
    )
