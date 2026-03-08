from datetime import datetime
from typing import List, Dict, Any
from app.utils.firebase import get_db
from app.config import settings
import httpx
import uuid


async def send_notification(user_id: str, title: str, body: str, data: Dict[str, Any] = {}) -> dict:
    db = get_db()
    notif_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    notif_data = {
        "id": notif_id,
        "user_id": user_id,
        "title": title,
        "body": body,
        "data": data,
        "is_read": False,
        "created_at": now,
    }
    db.collection("notifications").document(notif_id).set(notif_data)

    # Try to send FCM push
    user_doc = db.collection("users").document(user_id).get()
    if user_doc.exists:
        fcm_token = user_doc.to_dict().get("fcm_token")
        if fcm_token:
            await send_fcm_push(fcm_token, title, body, data)

    return notif_data


async def send_fcm_push(fcm_token: str, title: str, body: str, data: Dict[str, Any] = {}) -> bool:
    if not settings.fcm_server_key:
        return False

    payload = {
        "to": fcm_token,
        "notification": {"title": title, "body": body},
        "data": {k: str(v) for k, v in data.items()},
    }
    headers = {
        "Authorization": f"key={settings.fcm_server_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                json=payload,
                headers=headers,
                timeout=10,
            )
            return resp.status_code == 200
    except Exception:
        return False


async def get_notifications_by_user(user_id: str) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("notifications")
        .where("user_id", "==", user_id)
        .order_by("created_at", direction="DESCENDING")
        .limit(50)
        .get()
    )
    result = []
    for doc in docs:
        n = doc.to_dict()
        n["id"] = doc.id
        result.append(n)
    return result


async def mark_notification_read(notification_id: str) -> bool:
    db = get_db()
    db.collection("notifications").document(notification_id).update({"is_read": True})
    return True


async def mark_all_read(user_id: str) -> bool:
    db = get_db()
    docs = (
        db.collection("notifications")
        .where("user_id", "==", user_id)
        .where("is_read", "==", False)
        .get()
    )
    batch = db.batch()
    for doc in docs:
        batch.update(doc.reference, {"is_read": True})
    batch.commit()
    return True


async def broadcast_to_class(class_id: str, title: str, body: str) -> int:
    db = get_db()
    class_doc = db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        return 0

    student_ids = class_doc.to_dict().get("student_ids", [])
    sent = 0
    for sid in student_ids:
        await send_notification(sid, title, body, {"type": "announcement", "class_id": class_id})
        sent += 1
    return sent
