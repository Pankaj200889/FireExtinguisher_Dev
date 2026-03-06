from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure Cloudinary
cloudinary.config( 
    cloud_name = "dz92qndid", 
    api_key = "458416816738218", 
    api_secret = "nG_r4v2K3WUiK1v8hxKcDyAWWW8",
    secure = True
)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Upload to Cloudinary
        # We read the file into memory first to pass it to the uploader
        content = await file.read()
        
        # Upload
        upload_result = cloudinary.uploader.upload(content, folder="fire_safety_app")
        
        # Get secure URL
        url = upload_result.get("secure_url")
        
        return {"url": url}
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
