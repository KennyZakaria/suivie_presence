from datetime import datetime, timedelta
from typing import List, Dict
from functools import lru_cache
from collections import defaultdict
from app.utils.firebase import get_db


# Simple in-memory cache with TTL
_cache = {}
_cache_ttl = {}
CACHE_DURATION = 300  # 5 minutes in seconds


def get_cached_or_fetch(key: str, fetch_func, ttl: int = CACHE_DURATION):
    """Simple cache decorator for expensive operations"""
    now = datetime.utcnow().timestamp()
    
    if key in _cache and key in _cache_ttl:
        if now - _cache_ttl[key] < ttl:
            return _cache[key]
    
    result = fetch_func()
    _cache[key] = result
    _cache_ttl[key] = now
    return result


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
    """OPTIMIZED: Single query instead of 30+ queries"""
    db = get_db()
    
    # Calculate date range
    today = datetime.utcnow().date()
    start_date = (today - timedelta(days=days - 1)).strftime("%Y-%m-%d")
    
    # Single query for all attendance in date range
    docs = db.collection("attendance").where("date", ">=", start_date).get()
    
    # Group by date in memory (much faster than N queries)
    date_stats = defaultdict(lambda: {"total": 0, "present": 0})
    for doc in docs:
        data = doc.to_dict()
        date = data.get("date")
        if date:
            date_stats[date]["total"] += 1
            if data.get("status") in ("present", "late"):
                date_stats[date]["present"] += 1
    
    # Build result for all days (including days with no data)
    result = []
    for i in range(days - 1, -1, -1):
        date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        stats = date_stats.get(date, {"total": 0, "present": 0})
        total = stats["total"]
        present = stats["present"]
        rate = round(present / total * 100, 2) if total > 0 else 0.0
        result.append({"date": date, "total": total, "present": present, "rate": rate})
    
    return result


async def get_class_attendance_comparison() -> List[dict]:
    """OPTIMIZED: 2 queries instead of N+1 queries"""
    db = get_db()
    
    # Query 1: Get all active classes
    classes = db.collection("classes").where("is_active", "==", True).get()
    class_map = {cls_doc.id: cls_doc.to_dict() for cls_doc in classes}
    
    if not class_map:
        return []
    
    # Query 2: Get ALL attendance records at once
    all_attendance = db.collection("attendance").get()
    
    # Group attendance by class_id in memory
    class_stats = defaultdict(lambda: {"total": 0, "present": 0})
    for doc in all_attendance:
        data = doc.to_dict()
        class_id = data.get("class_id")
        if class_id in class_map:  # Only count for active classes
            class_stats[class_id]["total"] += 1
            if data.get("status") in ("present", "late"):
                class_stats[class_id]["present"] += 1
    
    # Build result
    result = []
    for class_id, cls_data in class_map.items():
        stats = class_stats.get(class_id, {"total": 0, "present": 0})
        total = stats["total"]
        present = stats["present"]
        rate = round(present / total * 100, 2) if total > 0 else 0.0
        result.append({
            "class_id": class_id,
            "class_name": cls_data.get("name"),
            "subject": cls_data.get("subject"),
            "total_records": total,
            "attendance_rate": rate,
        })
    
    return result


async def get_at_risk_students(threshold: float = 70.0) -> List[dict]:
    """OPTIMIZED: 2 queries instead of N+1 queries"""
    db = get_db()
    
    # Query 1: Get all students
    students = db.collection("users").where("role", "==", "student").get()
    student_map = {s_doc.id: s_doc.to_dict() for s_doc in students}
    
    if not student_map:
        return []
    
    # Query 2: Get ALL attendance records at once
    all_attendance = db.collection("attendance").get()
    
    # Group attendance by student_id in memory
    student_stats = defaultdict(lambda: {"total": 0, "present": 0})
    for doc in all_attendance:
        data = doc.to_dict()
        student_id = data.get("student_id")
        if student_id in student_map:  # Only count for existing students
            student_stats[student_id]["total"] += 1
            if data.get("status") in ("present", "late"):
                student_stats[student_id]["present"] += 1
    
    # Find at-risk students
    at_risk = []
    for student_id, student_data in student_map.items():
        stats = student_stats.get(student_id, {"total": 0, "present": 0})
        total = stats["total"]
        present = stats["present"]
        
        if total == 0:
            continue
        
        rate = round(present / total * 100, 2)
        if rate < threshold:
            at_risk.append({
                "student_id": student_id,
                "full_name": student_data.get("full_name"),
                "email": student_data.get("email"),
                "total_sessions": total,
                "present": present,
                "attendance_rate": rate,
            })
    
    # Sort by attendance rate (lowest first)
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
    """OPTIMIZED: Uses caching and reduces redundant queries"""
    cache_key = "dashboard_summary"
    
    def fetch_summary():
        db = get_db()
        
        # Get counts efficiently
        teachers_count = len(db.collection("users").where("role", "==", "teacher").get())
        students_count = len(db.collection("users").where("role", "==", "student").get())
        classes_count = len(db.collection("classes").where("is_active", "==", True).get())
        
        # Get attendance stats (reuse the same query)
        att_docs = db.collection("attendance").get()
        total_att = present_att = 0
        for doc in att_docs:
            total_att += 1
            if doc.to_dict().get("status") in ("present", "late"):
                present_att += 1
        attendance_rate = round(present_att / total_att * 100, 2) if total_att > 0 else 0.0
        
        # Get open reviews count
        open_reviews = len(db.collection("reviews").where("is_resolved", "==", False).get())
        
        return {
            "total_teachers": teachers_count,
            "total_students": students_count,
            "total_classes": classes_count,
            "overall_attendance_rate": attendance_rate,
            "open_reviews": open_reviews,
        }
    
    # Use cache with 5-minute TTL
    summary = get_cached_or_fetch(cache_key, fetch_summary, ttl=300)
    
    # Get recent trends (uses optimized function)
    trends = await get_attendance_trends(7)
    summary["recent_trends"] = trends
    
    return summary


def clear_analytics_cache():
    """Clear all analytics cache - call after bulk data updates"""
    global _cache, _cache_ttl
    _cache.clear()
    _cache_ttl.clear()
