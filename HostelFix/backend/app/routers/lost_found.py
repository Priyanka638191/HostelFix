from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from app.models import LostFoundCreate, LostFoundResponse
from app.auth import get_current_user, get_current_admin
from app.database import get_database
from app.cloudinary_config import upload_image
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=LostFoundResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_found(
    item_data: LostFoundCreate,
    current_user: str = Depends(get_current_user)
):
    """Create lost or found item"""
    db = get_database()
    
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    item_doc = {
        "item_name": item_data.item_name,
        "description": item_data.description,
        "location_found": item_data.location_found,
        "location_lost": item_data.location_lost,
        "item_type": item_data.item_type,
        "image_url": item_data.image_url,
        "created_by": current_user,
        "created_by_name": user["name"],
        "claimed_by": None,
        "is_resolved": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.lost_found.insert_one(item_doc)
    item_doc["id"] = str(result.inserted_id)
    item_doc.pop("_id", None)
    
    return LostFoundResponse(**item_doc)

@router.post("/upload-image")
async def upload_lost_found_image(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload image for lost/found item"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    image_url = await upload_image(file)
    return {"image_url": image_url}

@router.get("/", response_model=List[LostFoundResponse])
async def get_lost_found_items(
    item_type: str = None,
    current_user: str = Depends(get_current_user)
):
    """Get all lost/found items"""
    db = get_database()
    
    query = {}
    if item_type:
        query["item_type"] = item_type
    
    items = await db.lost_found.find(query).sort("created_at", -1).to_list(length=100)
    
    result = []
    for item in items:
        item["id"] = str(item["_id"])
        item.pop("_id", None)
        result.append(LostFoundResponse(**item))
    
    return result

@router.get("/{item_id}", response_model=LostFoundResponse)
async def get_lost_found_item(
    item_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get single lost/found item"""
    db = get_database()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item ID"
        )
    
    item = await db.lost_found.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    item["id"] = str(item["_id"])
    item.pop("_id", None)
    
    return LostFoundResponse(**item)

@router.post("/{item_id}/claim")
async def claim_item(
    item_id: str,
    current_user: str = Depends(get_current_user)
):
    """Claim a lost/found item"""
    db = get_database()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item ID"
        )
    
    item = await db.lost_found.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item.get("is_resolved"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item already claimed"
        )
    
    await db.lost_found.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$set": {
                "claimed_by": current_user,
                "is_resolved": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Item claimed successfully"}

@router.post("/{item_id}/approve-claim")
async def approve_claim(
    item_id: str,
    current_user: str = Depends(get_current_admin)
):
    """Approve claim (admin only)"""
    db = get_database()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item ID"
        )
    
    item = await db.lost_found.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Item is already marked as resolved when claimed
    return {"message": "Claim approved"}
