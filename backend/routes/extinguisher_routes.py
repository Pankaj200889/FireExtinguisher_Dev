from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
from typing import List, Optional
from datetime import date
import io
import qrcode
import os
from database import get_session
from models import Extinguisher, User, Inspection
from pydantic import BaseModel
import uuid
from auth import get_admin_user, get_current_user, get_optional_current_user

router = APIRouter(prefix="/extinguishers", tags=["extinguishers"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://fire-extinguisher-dev.vercel.app")

class ExtinguisherCreate(BaseModel):
    sl_no: str
    type: str
    capacity: str
    year_of_manufacture: int
    make: str
    location: str

class ExtinguisherRead(ExtinguisherCreate):
    id: uuid.UUID
    qr_code_url: Optional[str] = None
    last_inspection_status: Optional[str] = None
    next_service_due: Optional[date] = None
    last_inspector: Optional[str] = None
    mode: str = "VIEW" # VIEW, EDIT, LOCKED
    lastInspectionAt: Optional[str] = None
    debug_info: Optional[str] = None

# ... (skip to read_extinguisher)

@router.get("/{id}", response_model=ExtinguisherRead)
async def read_extinguisher(
    id: uuid.UUID, 
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    extinguisher = session.get(Extinguisher, id)
    if not extinguisher:
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Fetch latest inspection
    statement = select(Inspection).where(Inspection.extinguisher_id == id).order_by(Inspection.inspection_date.desc())
    latest_inspection = session.exec(statement).first()
    
    # --- CORE MODE DECISION LOGIC (IS 2190) ---
    mode = "VIEW"
    logs = [f"User: {current_user.username if current_user else 'None'}"]
    
    if current_user:
        if not latest_inspection:
            logs.append("No previous inspection -> EDIT")
            mode = "EDIT"
        else:
            now = datetime.now()
            diff = now - latest_inspection.inspection_date
            logs.append(f"Last Insp: {latest_inspection.inspection_date}")
            logs.append(f"Time Diff: {diff}")
            
            if diff < timedelta(hours=48):
                logs.append("Under 48h -> LOCKED")
                mode = "LOCKED"
            else:
                logs.append("Over 48h -> EDIT")
                mode = "EDIT"
    else:
        logs.append("No active session -> VIEW")
    
    # --- END CORE LOGIC ---

    status_label = "Pending Inspection"
    service_due = None
    inspector_name = "N/A"
    
    if latest_inspection:
        status_label = "Operational" 
        service_due = latest_inspection.due_for_refilling
        
        inspector = session.get(User, latest_inspection.inspector_id)
        if inspector:
            inspector_name = inspector.username

    response = ExtinguisherRead(
        **extinguisher.model_dump(),
        last_inspection_status=status_label,
        next_service_due=service_due,
        last_inspector=inspector_name,
        mode=mode,
        lastInspectionAt=latest_inspection.inspection_date.isoformat() if latest_inspection else None,
        debug_info=" | ".join(logs)
    )
    return response

@router.get("/{id}/qr")
async def get_qr_code(id: uuid.UUID, session: Session = Depends(get_session)):
    extinguisher = session.get(Extinguisher, id)
    if not extinguisher:
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Generate QR Image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    url = f"{FRONTEND_URL}/extinguisher/{id}" 
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return Response(content=img_byte_arr.getvalue(), media_type="image/png")
