from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.models import User, UserResponse, Token, UserRole
from app.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: User):
    """
    Register a new user. By default creates student accounts.
    To create admin account, use the create_admin.py script or /register/admin endpoint.
    """
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Security: Prevent admin registration through regular endpoint
    # Admin accounts should be created via script or special endpoint
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created through this endpoint. Use the create_admin.py script or contact an existing admin."
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document (defaults to student)
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": "student",  # Always student for regular registration
        "hostel": user_data.hostel,
        "block": user_data.block,
        "room": user_data.room,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    
    return UserResponse(**user_doc)

@router.post("/register/admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(
    user_data: User,
    admin_secret: str = Query(None, description="Admin registration secret key")
):
    """
    Register a new admin account.
    Requires admin_secret query parameter for security.
    Default secret: 'ADMIN_SECRET_2024' (change in production!)
    """
    import os
    
    # Get admin secret from environment or use default
    required_secret = os.getenv("ADMIN_REGISTRATION_SECRET", "ADMIN_SECRET_2024")
    
    if admin_secret != required_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin registration secret. Contact system administrator."
        )
    
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create admin user document
    user_doc = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": "admin",
        "hostel": user_data.hostel,
        "block": user_data.block,
        "room": user_data.room,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    
    return UserResponse(**user_doc)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Generic login endpoint (deprecated - use role-specific endpoints).
    Kept for backward compatibility.
    """
    db = get_database()
    
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_role = user.get("role", "student")
    access_token = create_access_token(
        data={"sub": user["email"]}, 
        expires_delta=access_token_expires,
        role=user_role
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/student", response_model=Token)
async def login_student(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Student-specific login endpoint with role validation.
    Only allows students to login through this endpoint.
    """
    db = get_database()
    
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Strict role validation: only students can use this endpoint
    if user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This login is for students only. Please use the admin login."
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, 
        expires_delta=access_token_expires,
        role="student"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/admin", response_model=Token)
async def login_admin(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Admin-specific login endpoint with role validation.
    Only allows admins to login through this endpoint.
    """
    db = get_database()
    
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Strict role validation: only admins can use this endpoint
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This login is for administrators only. Please use the student login."
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, 
        expires_delta=access_token_expires,
        role="admin"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user["id"] = str(user["_id"])
    user.pop("_id", None)
    user.pop("password", None)
    
    return UserResponse(**user)
