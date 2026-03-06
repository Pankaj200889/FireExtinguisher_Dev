from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from database import get_session
from models import CompanySettings
import shutil
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/settings", tags=["settings"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(CompanySettings).where(CompanySettings.id == 1)).first()
    if not settings:
        # Create default if not exists
        settings = CompanySettings(id=1, company_name="Siddhi Industrial Solutions")
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

@router.post("/")
async def update_settings(
    company_name: str = Form(...),
    logo: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    settings = session.exec(select(CompanySettings).where(CompanySettings.id == 1)).first()
    if not settings:
         settings = CompanySettings(id=1)
    
    settings.company_name = company_name
    
    if logo:
        try:
            # Generate unique filename
            file_ext = logo.filename.split(".")[-1] if "." in logo.filename else "jpg"
            filename = f"logo_{uuid.uuid4()}.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            
            # Update logo URL
            settings.logo_url = f"/static/{filename}"
        except Exception as e:
            print(f"Logo upload failed: {e}")
            raise HTTPException(status_code=500, detail="Logo upload failed")

    settings.updated_at = datetime.utcnow()
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings
