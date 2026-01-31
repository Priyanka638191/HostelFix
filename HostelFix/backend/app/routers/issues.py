from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from app.models import (
    IssueCreate, IssueUpdate, IssueResponse, CommentCreate,
    DuplicateCheckResponse, IssueStatus
)
from app.auth import get_current_user, get_current_admin
from app.database import get_database
from app.ml_duplicate_detection import duplicate_detector
from app.cloudinary_config import upload_image
from app.services.issue_service import IssueService
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate_issue(
    issue_data: IssueCreate,
    current_user: str = Depends(get_current_user)
):
    """Check if issue is duplicate before creation"""
    db = get_database()
    
    # Get existing open issues (not closed)
    existing_issues = await db.issues.find({
        "status": {"$ne": "closed"}
    }).to_list(length=100)
    
    # Combine title and description for similarity check
    issue_text = f"{issue_data.title} {issue_data.description}"
    
    # Detect duplicates
    result = duplicate_detector.detect_duplicates(issue_text, existing_issues)
    
    return DuplicateCheckResponse(**result)

@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_data: IssueCreate,
    current_user: str = Depends(get_current_user)
):
    db = get_database()
    
    # Get user info
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create issue document
    issue_doc = {
        "title": issue_data.title,
        "description": issue_data.description,
        "category": issue_data.category.value,
        "priority": issue_data.priority.value,
        "status": "reported",
        "is_public": issue_data.is_public,
        "image_url": issue_data.image_url,
        "created_by": current_user,
        "created_by_name": user["name"],
        "hostel": user.get("hostel"),
        "block": user.get("block"),
        "room": user.get("room"),
        "assigned_to": None,
        "remarks": None,
        "comments": [],
        "reactions": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "resolved_at": None
    }
    
    result = await db.issues.insert_one(issue_doc)
    issue_doc["id"] = str(result.inserted_id)
    issue_doc.pop("_id", None)
    
    return IssueResponse(**issue_doc)

@router.post("/upload-image")
async def upload_issue_image(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload image for issue"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    image_url = await upload_image(file)
    return {"image_url": image_url}

@router.get("/")
async def get_issues(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: str = Depends(get_current_user)
):
    """
    Get paginated list of issues with filtering and search.
    Returns paginated results with metadata.
    """
    db = get_database()
    user = await db.users.find_one({"email": current_user})
    user_role = user.get("role", "student") if user else "student"
    
    result = await IssueService.get_issues(
        user_email=current_user,
        user_role=user_role,
        status_filter=status_filter,
        category=category,
        priority=priority,
        search=search,
        page=page,
        limit=limit
    )
    
    # Convert to response models
    issues_response = [IssueResponse(**issue) for issue in result["issues"]]
    
    return {
        "issues": issues_response,
        "pagination": result["pagination"]
    }

@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(
    issue_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get single issue by ID"""
    db = get_database()
    
    if not ObjectId.is_valid(issue_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid issue ID"
        )
    
    issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check access
    user = await db.users.find_one({"email": current_user})
    if user.get("role") != "admin" and issue["created_by"] != current_user and not issue.get("is_public"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this issue"
        )
    
    issue["id"] = str(issue["_id"])
    issue.pop("_id", None)
    
    return IssueResponse(**issue)

@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: str,
    issue_update: IssueUpdate,
    current_user: str = Depends(get_current_admin)
):
    """Update issue (admin only)"""
    db = get_database()
    
    if not ObjectId.is_valid(issue_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid issue ID"
        )
    
    issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if issue_update.status:
        update_data["status"] = issue_update.status.value
        if issue_update.status.value in ["resolved", "closed"]:
            update_data["resolved_at"] = datetime.utcnow()
    
    if issue_update.assigned_to is not None:
        update_data["assigned_to"] = issue_update.assigned_to
    
    if issue_update.remarks is not None:
        update_data["remarks"] = issue_update.remarks
    
    await db.issues.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": update_data}
    )
    
    updated_issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    updated_issue["id"] = str(updated_issue["_id"])
    updated_issue.pop("_id", None)
    
    return IssueResponse(**updated_issue)

@router.post("/{issue_id}/comments", response_model=IssueResponse)
async def add_comment(
    issue_id: str,
    comment_data: CommentCreate,
    current_user: str = Depends(get_current_user)
):
    """Add comment to issue"""
    db = get_database()
    
    if not ObjectId.is_valid(issue_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid issue ID"
        )
    
    issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check if issue is public or user is creator/admin
    user = await db.users.find_one({"email": current_user})
    if user.get("role") != "admin" and issue["created_by"] != current_user and not issue.get("is_public"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to comment on this issue"
        )
    
    comment = {
        "content": comment_data.content,
        "created_by": current_user,
        "created_by_name": user["name"],
        "created_at": datetime.utcnow()
    }
    
    await db.issues.update_one(
        {"_id": ObjectId(issue_id)},
        {"$push": {"comments": comment}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    updated_issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    updated_issue["id"] = str(updated_issue["_id"])
    updated_issue.pop("_id", None)
    
    return IssueResponse(**updated_issue)

@router.post("/{issue_id}/react")
async def react_to_issue(
    issue_id: str,
    reaction_type: str,
    current_user: str = Depends(get_current_user)
):
    """React to issue (like/upvote)"""
    db = get_database()
    
    if not ObjectId.is_valid(issue_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid issue ID"
        )
    
    issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    if reaction_type not in ["like", "upvote"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reaction type"
        )
    
    reactions = issue.get("reactions", {})
    reaction_key = f"{reaction_type}s"
    
    if reaction_key not in reactions:
        reactions[reaction_key] = []
    
    # Toggle reaction
    if current_user in reactions[reaction_key]:
        reactions[reaction_key].remove(current_user)
    else:
        reactions[reaction_key].append(current_user)
    
    await db.issues.update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": {"reactions": reactions, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Reaction updated", "reactions": reactions}
