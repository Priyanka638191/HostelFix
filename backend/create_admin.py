"""
Script to create a new admin account
Usage: python create_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
import getpass

load_dotenv()

async def create_admin():
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hostelfix")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.get_database()
    
    print("=" * 50)
    print("Create Admin Account")
    print("=" * 50)
    
    # Get admin details
    name = input("Enter admin name: ").strip()
    email = input("Enter admin email: ").strip()
    password = getpass.getpass("Enter admin password: ").strip()
    
    if not name or not email or not password:
        print("❌ All fields are required!")
        client.close()
        return
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        print(f"❌ User with email {email} already exists!")
        response = input("Do you want to promote this user to admin? (y/n): ").strip().lower()
        if response == 'y':
            await db.users.update_one(
                {"email": email},
                {"$set": {"role": "admin"}}
            )
            print(f"✅ User {email} has been promoted to admin!")
        client.close()
        return
    
    # Hash password
    from app.auth import get_password_hash
    hashed_password = get_password_hash(password)
    
    # Create admin user
    admin_user = {
        "email": email,
        "password": hashed_password,
        "name": name,
        "role": "admin",
        "hostel": None,
        "block": None,
        "room": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(admin_user)
    print("\n✅ Admin account created successfully!")
    print(f"   Email: {email}")
    print(f"   Name: {name}")
    print(f"   Role: admin")
    print(f"\nYou can now login at: http://localhost:3000/login/admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
