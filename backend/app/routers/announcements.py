from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models import AnnouncementCreate, AnnouncementResponse
from app.auth import get_current_user, get_current_admin
from app.database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: str = Depends(get_current_admin)
):
    """Create announcement (admin only)"""
    db = get_database()
    
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    announcement_doc = {
        "title": announcement_data.title,
        "content": announcement_data.content,
        "target_hostel": announcement_data.target_hostel,
        "target_block": announcement_data.target_block,
        "is_urgent": announcement_data.is_urgent,
        "created_by": current_user,
        "created_by_name": user["name"],
        "created_at": datetime.utcnow()
    }
    
    result = await db.announcements.insert_one(announcement_doc)
    announcement_doc["id"] = str(result.inserted_id)
    announcement_doc.pop("_id", None)
    
    return AnnouncementResponse(**announcement_doc)

@router.get("/", response_model=List[AnnouncementResponse])
async def get_announcements(
    current_user: str = Depends(get_current_user)
):
    """Get announcements (filtered by user's hostel/block if specified)"""
    db = get_database()
    
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build query for targeted announcements
    query = {
        "$or": [
            {"target_hostel": None},  # General announcements
            {"target_hostel": user.get("hostel")}  # Hostel-specific
        ]
    }
    
    # If user has a block, also include block-specific announcements
    if user.get("block"):
        query["$or"].append({"target_block": user.get("block")})
    
    announcements = await db.announcements.find(query).sort("created_at", -1).to_list(length=50)
    
    result = []
    for announcement in announcements:
        announcement["id"] = str(announcement["_id"])
        announcement.pop("_id", None)
        result.append(AnnouncementResponse(**announcement))
    
    return result

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get single announcement"""
    db = get_database()
    
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID"
        )
    
    announcement = await db.announcements.find_one({"_id": ObjectId(announcement_id)})
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    announcement["id"] = str(announcement["_id"])
    announcement.pop("_id", None)
    
    return AnnouncementResponse(**announcement)

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: str = Depends(get_current_admin)
):
    """Delete announcement (admin only)"""
    db = get_database()
    
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID"
        )
    
    result = await db.announcements.delete_one({"_id": ObjectId(announcement_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    return {"message": "Announcement deleted successfully"}
