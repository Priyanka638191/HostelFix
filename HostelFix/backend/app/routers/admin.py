from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.auth import get_current_admin
from app.database import get_database
from app.services.issue_service import IssueService
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(current_user: str = Depends(get_current_admin)):
    """Get admin dashboard analytics"""
    db = get_database()
    
    # Total issues
    total_issues = await db.issues.count_documents({})
    
    # Pending issues (not resolved/closed)
    pending_issues = await db.issues.count_documents({
        "status": {"$nin": ["resolved", "closed"]}
    })
    
    # Resolved issues
    resolved_issues = await db.issues.count_documents({
        "status": {"$in": ["resolved", "closed"]}
    })
    
    # Category distribution
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_dist = await db.issues.aggregate(category_pipeline).to_list(length=20)
    category_distribution = {item["_id"]: item["count"] for item in category_dist}
    
    # Priority distribution
    priority_pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    priority_dist = await db.issues.aggregate(priority_pipeline).to_list(length=20)
    priority_distribution = {item["_id"]: item["count"] for item in priority_dist}
    
    # Hostel/Block distribution
    hostel_pipeline = [
        {"$match": {"hostel": {"$ne": None}}},
        {"$group": {"_id": "$hostel", "count": {"$sum": 1}}}
    ]
    hostel_dist = await db.issues.aggregate(hostel_pipeline).to_list(length=20)
    hostel_distribution = {item["_id"]: item["count"] for item in hostel_dist}
    
    # Block distribution
    block_pipeline = [
        {"$match": {"block": {"$ne": None}}},
        {"$group": {"_id": "$block", "count": {"$sum": 1}}}
    ]
    block_dist = await db.issues.aggregate(block_pipeline).to_list(length=20)
    block_distribution = {item["_id"]: item["count"] for item in block_dist}
    
    # Average resolution time
    resolved_issues_with_time = await db.issues.find({
        "status": {"$in": ["resolved", "closed"]},
        "resolved_at": {"$ne": None}
    }).to_list(length=1000)
    
    total_resolution_time = 0
    count_with_time = 0
    
    for issue in resolved_issues_with_time:
        if issue.get("resolved_at") and issue.get("created_at"):
            created = issue["created_at"]
            resolved = issue["resolved_at"]
            if isinstance(created, datetime) and isinstance(resolved, datetime):
                diff = (resolved - created).total_seconds() / 3600  # hours
                total_resolution_time += diff
                count_with_time += 1
    
    avg_resolution_hours = total_resolution_time / count_with_time if count_with_time > 0 else 0
    
    # Get delayed issues (exceeding average resolution time)
    delayed_issues = await IssueService.get_delayed_issues(avg_resolution_hours)
    
    # Recent issues (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_issues = await db.issues.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    # Status distribution
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_dist = await db.issues.aggregate(status_pipeline).to_list(length=20)
    status_distribution = {item["_id"]: item["count"] for item in status_dist}
    
    # Issue heatmap data (hostel/block density)
    heatmap_data = []
    for hostel, count in hostel_distribution.items():
        # Get block distribution for this hostel
        block_pipeline = [
            {"$match": {"hostel": hostel, "block": {"$ne": None}}},
            {"$group": {"_id": "$block", "count": {"$sum": 1}}}
        ]
        blocks = await db.issues.aggregate(block_pipeline).to_list(length=20)
        for block in blocks:
            heatmap_data.append({
                "hostel": hostel,
                "block": block["_id"],
                "count": block["count"],
                "intensity": min(block["count"] / max(hostel_distribution.values()) if hostel_distribution.values() else 1, 1.0)
            })
    
    return {
        "total_issues": total_issues,
        "pending_issues": pending_issues,
        "resolved_issues": resolved_issues,
        "category_distribution": category_distribution,
        "priority_distribution": priority_distribution,
        "hostel_distribution": hostel_distribution,
        "block_distribution": block_distribution,
        "average_resolution_hours": round(avg_resolution_hours, 2),
        "recent_issues_7days": recent_issues,
        "status_distribution": status_distribution,
        "delayed_issues_count": len(delayed_issues),
        "delayed_issues": delayed_issues[:10],  # Top 10 delayed issues
        "heatmap_data": heatmap_data
    }

@router.get("/caretakers")
async def get_caretakers(current_user: str = Depends(get_current_admin)):
    """Get list of caretakers for assignment"""
    db = get_database()
    
    # In a real system, you'd have a caretakers collection
    # For now, return a mock list or users with specific role
    caretakers = await db.users.find({
        "role": {"$in": ["admin", "caretaker"]}
    }).to_list(length=50)
    
    result = []
    for caretaker in caretakers:
        result.append({
            "id": str(caretaker["_id"]),
            "name": caretaker.get("name", ""),
            "email": caretaker.get("email", "")
        })
    
    return result

@router.get("/issues/all")
async def get_all_issues_admin(
    page: int = 1,
    limit: int = 50,
    current_user: str = Depends(get_current_admin)
):
    """Get all issues for admin with pagination"""
    result = await IssueService.get_issues(
        user_email=current_user,
        user_role="admin",
        page=page,
        limit=limit
    )
    return result

@router.get("/delayed-issues")
async def get_delayed_issues(current_user: str = Depends(get_current_admin)):
    """Get issues that exceed average resolution time"""
    db = get_database()
    
    # Calculate average resolution time
    resolved_issues = await db.issues.find({
        "status": {"$in": ["resolved", "closed"]},
        "resolved_at": {"$ne": None}
    }).to_list(length=1000)
    
    total_time = 0
    count = 0
    for issue in resolved_issues:
        if issue.get("resolved_at") and issue.get("created_at"):
            created = issue["created_at"]
            resolved = issue["resolved_at"]
            if isinstance(created, datetime) and isinstance(resolved, datetime):
                diff = (resolved - created).total_seconds() / 3600
                total_time += diff
                count += 1
    
    avg_hours = total_time / count if count > 0 else 24  # Default to 24 hours
    
    delayed = await IssueService.get_delayed_issues(avg_hours)
    return {"delayed_issues": delayed, "average_resolution_hours": round(avg_hours, 2)}
