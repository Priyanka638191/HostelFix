"""
Seed script to populate database with sample data
Run: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

async def seed_database():
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hostelfix")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.get_database()
    
    # Clear existing data
    await db.users.delete_many({})
    await db.issues.delete_many({})
    await db.announcements.delete_many({})
    await db.lost_found.delete_many({})
    
    print("🌱 Seeding database...")
    
    # Create admin user
    from app.auth import get_password_hash
    admin_user = {
        "email": "admin@hostelfix.com",
        "password": get_password_hash("admin123"),
        "name": "Admin User",
        "role": "admin",
        "hostel": "Hostel A",
        "block": "Block 1",
        "room": "101",
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin_user)
    print("✅ Created admin user: admin@hostelfix.com / admin123")
    
    # Create student users
    students = [
        {
            "email": "student1@hostelfix.com",
            "password": get_password_hash("student123"),
            "name": "John Doe",
            "role": "student",
            "hostel": "Hostel A",
            "block": "Block 1",
            "room": "201",
            "created_at": datetime.utcnow()
        },
        {
            "email": "student2@hostelfix.com",
            "password": get_password_hash("student123"),
            "name": "Jane Smith",
            "role": "student",
            "hostel": "Hostel A",
            "block": "Block 2",
            "room": "305",
            "created_at": datetime.utcnow()
        },
        {
            "email": "student3@hostelfix.com",
            "password": get_password_hash("student123"),
            "name": "Bob Johnson",
            "role": "student",
            "hostel": "Hostel B",
            "block": "Block 1",
            "room": "102",
            "created_at": datetime.utcnow()
        }
    ]
    
    for student in students:
        await db.users.insert_one(student)
    print(f"✅ Created {len(students)} student users (password: student123)")
    
    # Create sample issues
    issues = [
        {
            "title": "Leaking tap in bathroom",
            "description": "The tap in the bathroom is leaking continuously. Water is being wasted. Please fix it as soon as possible.",
            "category": "plumbing",
            "priority": "medium",
            "status": "reported",
            "is_public": True,
            "image_url": None,
            "created_by": "student1@hostelfix.com",
            "created_by_name": "John Doe",
            "hostel": "Hostel A",
            "block": "Block 1",
            "room": "201",
            "assigned_to": None,
            "remarks": None,
            "comments": [],
            "reactions": {},
            "created_at": datetime.utcnow() - timedelta(days=2),
            "updated_at": datetime.utcnow() - timedelta(days=2),
            "resolved_at": None
        },
        {
            "title": "No internet connection in room",
            "description": "WiFi is not working in my room. I've tried restarting the router but it's still not connecting. This is affecting my online classes.",
            "category": "internet",
            "priority": "high",
            "status": "in_progress",
            "is_public": True,
            "image_url": None,
            "created_by": "student2@hostelfix.com",
            "created_by_name": "Jane Smith",
            "hostel": "Hostel A",
            "block": "Block 2",
            "room": "305",
            "assigned_to": "admin@hostelfix.com",
            "remarks": "Technician assigned, will visit tomorrow",
            "comments": [
                {
                    "content": "Same issue here in room 304",
                    "created_by": "student3@hostelfix.com",
                    "created_by_name": "Bob Johnson",
                    "created_at": datetime.utcnow() - timedelta(days=1)
                }
            ],
            "reactions": {"likes": ["student3@hostelfix.com"], "upvotes": ["student1@hostelfix.com"]},
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(hours=5),
            "resolved_at": None
        },
        {
            "title": "Broken light in corridor",
            "description": "The light in the corridor on the 2nd floor is not working. It's very dark at night and poses a safety risk.",
            "category": "electrical",
            "priority": "high",
            "status": "resolved",
            "is_public": True,
            "image_url": None,
            "created_by": "student1@hostelfix.com",
            "created_by_name": "John Doe",
            "hostel": "Hostel A",
            "block": "Block 1",
            "room": "201",
            "assigned_to": "admin@hostelfix.com",
            "remarks": "Light bulb replaced. Issue resolved.",
            "comments": [],
            "reactions": {"likes": ["student2@hostelfix.com"]},
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=1),
            "resolved_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "title": "Cleaning required in common area",
            "description": "The common area on the ground floor needs cleaning. There's a lot of dust and trash.",
            "category": "cleaning",
            "priority": "low",
            "status": "assigned",
            "is_public": True,
            "image_url": None,
            "created_by": "student3@hostelfix.com",
            "created_by_name": "Bob Johnson",
            "hostel": "Hostel B",
            "block": "Block 1",
            "room": "102",
            "assigned_to": "admin@hostelfix.com",
            "remarks": None,
            "comments": [],
            "reactions": {},
            "created_at": datetime.utcnow() - timedelta(hours=12),
            "updated_at": datetime.utcnow() - timedelta(hours=2),
            "resolved_at": None
        }
    ]
    
    for issue in issues:
        await db.issues.insert_one(issue)
    print(f"✅ Created {len(issues)} sample issues")
    
    # Create sample announcements
    announcements = [
        {
            "title": "Water supply interruption tomorrow",
            "content": "There will be a water supply interruption on Block 1 from 10 AM to 2 PM tomorrow for maintenance work. Please store water in advance.",
            "target_hostel": "Hostel A",
            "target_block": "Block 1",
            "is_urgent": True,
            "created_by": "admin@hostelfix.com",
            "created_by_name": "Admin User",
            "created_at": datetime.utcnow() - timedelta(hours=6)
        },
        {
            "title": "Welcome to HostelFix",
            "content": "Welcome to HostelFix! Use this platform to report any issues, find lost items, and stay updated with announcements. We're here to help!",
            "target_hostel": None,
            "target_block": None,
            "is_urgent": False,
            "created_by": "admin@hostelfix.com",
            "created_by_name": "Admin User",
            "created_at": datetime.utcnow() - timedelta(days=7)
        }
    ]
    
    for announcement in announcements:
        await db.announcements.insert_one(announcement)
    print(f"✅ Created {len(announcements)} sample announcements")
    
    # Create sample lost & found items
    lost_found_items = [
        {
            "item_name": "Black wallet",
            "description": "Found a black leather wallet near the cafeteria. Contains ID card and some cash.",
            "location_found": "Near cafeteria",
            "location_lost": None,
            "item_type": "found",
            "image_url": None,
            "created_by": "student2@hostelfix.com",
            "created_by_name": "Jane Smith",
            "claimed_by": None,
            "is_resolved": False,
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "item_name": "Blue water bottle",
            "description": "Lost my blue water bottle with stickers. Last seen in the library.",
            "location_found": None,
            "location_lost": "Library",
            "item_type": "lost",
            "image_url": None,
            "created_by": "student1@hostelfix.com",
            "created_by_name": "John Doe",
            "claimed_by": None,
            "is_resolved": False,
            "created_at": datetime.utcnow() - timedelta(hours=8),
            "updated_at": datetime.utcnow() - timedelta(hours=8)
        }
    ]
    
    for item in lost_found_items:
        await db.lost_found.insert_one(item)
    print(f"✅ Created {len(lost_found_items)} sample lost & found items")
    
    print("\n🎉 Database seeding completed!")
    print("\nLogin credentials:")
    print("Admin: admin@hostelfix.com / admin123")
    print("Student: student1@hostelfix.com / student123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
