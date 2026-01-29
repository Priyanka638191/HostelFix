import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "")
)

async def upload_image(file) -> str:
    """Upload image to Cloudinary and return URL"""
    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder="hostelfix",
            resource_type="image"
        )
        return result.get("secure_url", "")
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise Exception("Failed to upload image")
