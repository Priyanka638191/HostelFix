from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class IssueStatus(str, Enum):
    REPORTED = "reported"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class IssueCategory(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    SECURITY = "security"
    INTERNET = "internet"
    OTHER = "other"

class User(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.STUDENT
    hostel: Optional[str] = None
    block: Optional[str] = None
    room: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    hostel: Optional[str] = None
    block: Optional[str] = None
    room: Optional[str] = None
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class IssueCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: IssueCategory
    priority: IssuePriority
    is_public: bool = True
    image_url: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class ReactionType(str, Enum):
    LIKE = "like"
    UPVOTE = "upvote"

class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: IssueCategory
    priority: IssuePriority
    status: IssueStatus
    is_public: bool
    image_url: Optional[str] = None
    created_by: str
    created_by_name: str
    hostel: Optional[str] = None
    block: Optional[str] = None
    room: Optional[str] = None
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None
    comments: List[dict] = []
    reactions: dict = {}
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

class LostFoundCreate(BaseModel):
    item_name: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    location_found: Optional[str] = None
    location_lost: Optional[str] = None
    item_type: str = Field(..., pattern="^(lost|found)$")
    image_url: Optional[str] = None

class LostFoundResponse(BaseModel):
    id: str
    item_name: str
    description: str
    location_found: Optional[str] = None
    location_lost: Optional[str] = None
    item_type: str
    image_url: Optional[str] = None
    created_by: str
    created_by_name: str
    claimed_by: Optional[str] = None
    is_resolved: bool
    created_at: datetime
    updated_at: datetime

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=2000)
    target_hostel: Optional[str] = None
    target_block: Optional[str] = None
    is_urgent: bool = False

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    target_hostel: Optional[str] = None
    target_block: Optional[str] = None
    is_urgent: bool
    created_by: str
    created_by_name: str
    created_at: datetime

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    similarity_score: float
    similar_issues: List[dict] = []
