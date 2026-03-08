from datetime import datetime, timedelta
from typing import List
from app.utils.firebase import get_db


async def get_overall_attendance_stats() -> dict:
    db = get_db()
    docs = db.collection("attendance").get()
    total = present = absent = late = 0
    for doc in docs:
        a = doc.to_dict()
        total += 1
        s = a.get("status", "")
        if s == "present":
            present += 1
        elif s == "absent":
            absent += 1
        elif s == "late":
            late += 1

    def pct(n):
        return round(n / total * 100, 2) if total > 0 else 0.0

    return {
        "total": total,
        "present": present,
        "absent": absent,
        "late": late,
        "present_rate": pct(present),
        "absent_rate": pct(absent),
        "late_rate": pct(late),
    }


async def get_attendance_trends(days: int = 30) -> List[dict]:
    db = get_db()
    result = []
    today = datetime.utcnow().date()
    for i in range(days - 1, -1, -1):
        date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        docs = db.collection("attendance").where("date", "==", date).get()
        total = present = 0
        for doc in docs:
            total += 1
            if doc.to_dict().get("status") in ("present", "late"):
                present += 1
        rate = round(present / total * 100, 2) if total > 0 else 0.0
        result.append({"date": date, "total": total, "present": present, "rate": rate})
    return result


async def get_class_attendance_comparison() -> List[dict]:
    db = get_db()
    classes = db.collection("classes").where("is_active", "==", True).get()
    result = []
    for cls_doc in classes:
        cls = cls_doc.to_dict()
        class_id = cls_doc.id
        docs = db.collection("attendance").where("class_id", "==", class_id).get()
        total = present = 0
        for doc in docs:
            total += 1
            if doc.to_dict().get("status") in ("present", "late"):
                present += 1
        rate = round(present / total * 100, 2) if total > 0 else 0.0
        result.append({
            "class_id": class_id,
            "class_name": cls.get("name"),
            "subject": cls.get("subject"),
            "total_records": total,
            "attendance_rate": rate,
        })
    return result


async def get_at_risk_students(threshold: float = 70.0) -> List[dict]:
    db = get_db()
    students = db.collection("users").where("role", "==", "student").get()
    at_risk = []
    for s_doc in students:
        student = s_doc.to_dict()
        student_id = s_doc.id
        docs = db.collection("attendance").where("student_id", "==", student_id).get()
        total = present = 0
        for doc in docs:
            total += 1
            if doc.to_dict().get("status") in ("present", "late"):
                present += 1
        if total == 0:
            continue
        rate = round(present / total * 100, 2)
        if rate < threshold:
            at_risk.append({
                "student_id": student_id,
                "full_name": student.get("full_name"),
                "email": student.get("email"),
                "total_sessions": total,
                "present": present,
                "attendance_rate": rate,
            })
    at_risk.sort(key=lambda x: x["attendance_rate"])
    return at_risk


async def get_review_stats_by_level() -> dict:
    db = get_db()
    docs = db.collection("reviews").get()
    stats = {"level_1": 0, "level_2": 0, "level_3": 0, "total": 0, "resolved": 0}
    for doc in docs:
        r = doc.to_dict()
        lvl = r.get("level", 1)
        stats[f"level_{lvl}"] = stats.get(f"level_{lvl}", 0) + 1
        stats["total"] += 1
        if r.get("is_resolved"):
            stats["resolved"] += 1
    return stats


async def get_dashboard_summary() -> dict:
    db = get_db()

    teachers_count = len(db.collection("users").where("role", "==", "teacher").get())
    students_count = len(db.collection("users").where("role", "==", "student").get())
    classes_count = len(db.collection("classes").where("is_active", "==", True).get())

    att_docs = db.collection("attendance").get()
    total_att = present_att = 0
    for doc in att_docs:
        total_att += 1
        if doc.to_dict().get("status") in ("present", "late"):
            present_att += 1
    attendance_rate = round(present_att / total_att * 100, 2) if total_att > 0 else 0.0

    open_reviews = len(db.collection("reviews").where("is_resolved", "==", False).get())
    trends = await get_attendance_trends(7)

    return {
        "total_teachers": teachers_count,
        "total_students": students_count,
        "total_classes": classes_count,
        "overall_attendance_rate": attendance_rate,
        "open_reviews": open_reviews,
        "recent_trends": trends,
    }
