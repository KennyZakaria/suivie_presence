import uuid
from datetime import datetime
from typing import Optional, List
from app.utils.firebase import get_db


async def record_activity(
    user_id: str,
    user_email: str,
    user_role: str,
    action: str,
    session_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> dict:
    db = get_db()
    activity_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    data = {
        "id": activity_id,
        "user_id": user_id,
        "user_email": user_email,
        "user_role": user_role,
        "action": action,
        "session_id": session_id or activity_id,
        "ip_address": ip_address,
        "timestamp": now,
        "duration_seconds": None,
    }
    db.collection("user_activity").document(activity_id).set(data)
    return data


async def record_logout(user_id: str, session_id: str) -> None:
    """Find the login event for this session and compute duration."""
    db = get_db()
    logins = (
        db.collection("user_activity")
        .where("user_id", "==", user_id)
        .where("session_id", "==", session_id)
        .where("action", "==", "login")
        .limit(1)
        .get()
    )
    now = datetime.utcnow()
    activity_id = str(uuid.uuid4())
    duration = None
    user_email = ""
    user_role = ""
    if logins:
        login_doc = logins[0].to_dict()
        user_email = login_doc.get("user_email", "")
        user_role = login_doc.get("user_role", "")
        try:
            login_time = datetime.fromisoformat(login_doc["timestamp"])
            duration = int((now - login_time).total_seconds())
        except Exception:
            pass

    data = {
        "id": activity_id,
        "user_id": user_id,
        "user_email": user_email,
        "user_role": user_role,
        "action": "logout",
        "session_id": session_id,
        "ip_address": None,
        "timestamp": now.isoformat(),
        "duration_seconds": duration,
    }
    db.collection("user_activity").document(activity_id).set(data)


async def get_all_activity(limit: int = 200) -> List[dict]:
    db = get_db()
    docs = (
        db.collection("user_activity")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .get()
    )
    result = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        result.append(d)
    return result
