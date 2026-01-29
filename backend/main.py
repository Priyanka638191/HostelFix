from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, issues, admin, lost_found, announcements

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="HostelFix API",
    description="Smart Hostel Issue Tracking System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with API versioning
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(issues.router, prefix="/api/v1/issues", tags=["Issues"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(lost_found.router, prefix="/api/v1/lost-found", tags=["Lost & Found"])
app.include_router(announcements.router, prefix="/api/v1/announcements", tags=["Announcements"])

# Backward compatibility: include old routes without version
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication (Legacy)"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues (Legacy)"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin (Legacy)"])
app.include_router(lost_found.router, prefix="/api/lost-found", tags=["Lost & Found (Legacy)"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements (Legacy)"])

@app.get("/")
async def root():
    return {"message": "HostelFix API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
