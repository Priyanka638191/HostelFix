from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

client: AsyncIOMotorClient = None
database = None

async def connect_to_mongo():
    global client, database
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hostelfix")
    try:
        client = AsyncIOMotorClient(mongodb_uri)
        # Extract database name from URI or use default
        if "/" in mongodb_uri.split("?")[0]:
            db_name = mongodb_uri.split("/")[-1].split("?")[0]
            if db_name:
                database = client[db_name]
            else:
                database = client.get_database("hostelfix")
        else:
            database = client.get_database("hostelfix")
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

def get_database():
    return database
