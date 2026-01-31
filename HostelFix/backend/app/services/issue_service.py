"""
Issue service layer for business logic separation.
Handles all issue-related operations and validations.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.database import get_database
from app.ml_duplicate_detection import duplicate_detector
from bson import ObjectId


class IssueService:
    """Service class for issue management operations."""
    
    @staticmethod
    async def create_issue(issue_data: dict, user_email: str) -> dict:
        """
        Create a new issue with automatic user information tagging.
        
        Args:
            issue_data: Issue data dictionary
            user_email: Email of the user creating the issue
        
        Returns:
            Created issue document
        """
        db = get_database()
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise ValueError("User not found")
        
        issue_doc = {
            "title": issue_data.get("title"),
            "description": issue_data.get("description"),
            "category": issue_data.get("category"),
            "priority": issue_data.get("priority"),
            "status": "reported",
            "is_public": issue_data.get("is_public", True),
            "image_url": issue_data.get("image_url"),
            "created_by": user_email,
            "created_by_name": user.get("name"),
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
        return issue_doc
    
    @staticmethod
    async def check_duplicates(title: str, description: str) -> dict:
        """
        Check for duplicate issues using ML/NLP.
        
        Args:
            title: Issue title
            description: Issue description
        
        Returns:
            Duplicate detection results with similarity scores
        """
        db = get_database()
        existing_issues = await db.issues.find({
            "status": {"$ne": "closed"}
        }).to_list(length=100)
        
        issue_text = f"{title} {description}"
        result = duplicate_detector.detect_duplicates(issue_text, existing_issues)
        
        return result
    
    @staticmethod
    async def get_issues(
        user_email: str,
        user_role: str,
        status_filter: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict:
        """
        Get paginated list of issues with filtering and search.
        
        Args:
            user_email: Current user email
            user_role: Current user role
            status_filter: Filter by status
            category: Filter by category
            priority: Filter by priority
            search: Search query
            page: Page number (1-indexed)
            limit: Items per page
        
        Returns:
            Dictionary with issues list and pagination metadata
        """
        db = get_database()
        query = {}
        
        # Role-based access control
        if user_role != "admin":
            query = {
                "$or": [
                    {"is_public": True},
                    {"created_by": user_email}
                ]
            }
        
        # Apply filters
        if status_filter:
            query["status"] = status_filter
        if category:
            query["category"] = category
        if priority:
            query["priority"] = priority
        
        # Text search
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
            if user_role != "admin":
                # Maintain access control with search
                query = {
                    "$and": [
                        query,
                        {
                            "$or": [
                                {"is_public": True},
                                {"created_by": user_email}
                            ]
                        }
                    ]
                }
        
        # Count total matching documents
        total = await db.issues.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        # Fetch paginated results
        issues = await db.issues.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
        # Format results
        result = []
        for issue in issues:
            issue["id"] = str(issue["_id"])
            issue.pop("_id", None)
            result.append(issue)
        
        return {
            "issues": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    
    @staticmethod
    async def get_issue_by_id(issue_id: str, user_email: str, user_role: str) -> Optional[dict]:
        """
        Get single issue by ID with access control.
        
        Args:
            issue_id: Issue ID
            user_email: Current user email
            user_role: Current user role
        
        Returns:
            Issue document or None if not found/not authorized
        """
        db = get_database()
        if not ObjectId.is_valid(issue_id):
            return None
        
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue:
            return None
        
        # Access control
        if user_role != "admin" and issue["created_by"] != user_email and not issue.get("is_public"):
            return None
        
        issue["id"] = str(issue["_id"])
        issue.pop("_id", None)
        return issue
    
    @staticmethod
    async def calculate_resolution_time(issue_id: str) -> Optional[float]:
        """
        Calculate resolution time in hours for an issue.
        
        Args:
            issue_id: Issue ID
        
        Returns:
            Resolution time in hours or None
        """
        db = get_database()
        if not ObjectId.is_valid(issue_id):
            return None
        
        issue = await db.issues.find_one({"_id": ObjectId(issue_id)})
        if not issue or not issue.get("resolved_at") or not issue.get("created_at"):
            return None
        
        created = issue["created_at"]
        resolved = issue["resolved_at"]
        
        if isinstance(created, datetime) and isinstance(resolved, datetime):
            diff = (resolved - created).total_seconds() / 3600
            return diff
        
        return None
    
    @staticmethod
    async def get_delayed_issues(avg_resolution_hours: float) -> List[dict]:
        """
        Get issues that exceed average resolution time.
        
        Args:
            avg_resolution_hours: Average resolution time in hours
        
        Returns:
            List of delayed issues
        """
        db = get_database()
        now = datetime.utcnow()
        
        # Find issues that are still open and exceed average resolution time
        threshold_time = now - timedelta(hours=avg_resolution_hours)
        
        delayed_issues = await db.issues.find({
            "status": {"$nin": ["resolved", "closed"]},
            "created_at": {"$lt": threshold_time}
        }).to_list(length=100)
        
        result = []
        for issue in delayed_issues:
            created = issue.get("created_at")
            if isinstance(created, datetime):
                hours_open = (now - created).total_seconds() / 3600
                issue["hours_open"] = round(hours_open, 2)
                issue["id"] = str(issue["_id"])
                issue.pop("_id", None)
                result.append(issue)
        
        return result
