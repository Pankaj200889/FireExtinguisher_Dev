from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
from typing import List, Optional
from datetime import date
import io
import qrcode
import os
from database import get_session
from models import Extinguisher, User, Inspection

router = APIRouter(prefix="/extinguishers", tags=["extinguishers"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

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

@router.post("/", response_model=ExtinguisherRead)
async def create_extinguisher(
    extinguisher: ExtinguisherCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    # Check uniqueness of Sl No
    existing = session.exec(select(Extinguisher).where(Extinguisher.sl_no == extinguisher.sl_no)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Extinguisher with this Serial Number already exists.")
    
    db_obj = Extinguisher(**extinguisher.model_dump())
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    # Generate QR URL (Public Access Link)
    # The QR code will point to the frontend scan page
    db_obj.qr_code_url = f"{FRONTEND_URL}/scan/{db_obj.id}"
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    return db_obj

@router.get("/", response_model=List[ExtinguisherRead])
async def read_extinguishers(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    extinguishers = session.exec(select(Extinguisher)).all()
    return extinguishers

@router.get("/{id}", response_model=ExtinguisherRead)
async def read_extinguisher(id: uuid.UUID, session: Session = Depends(get_session)):
    extinguisher = session.get(Extinguisher, id)
    if not extinguisher:
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Fetch latest inspection
    statement = select(Inspection).where(Inspection.extinguisher_id == id).order_by(Inspection.inspection_date.desc())
    latest_inspection = session.exec(statement).first()
    
    status_label = "Pending Inspection"
    service_due = None
    inspector_name = "N/A"
    
    if latest_inspection:
        status_label = "Operational" # Logic can depend on remarks or age
        service_due = latest_inspection.due_for_refilling
        
        # Get inspector name
        inspector = session.get(User, latest_inspection.inspector_id)
        if inspector:
            inspector_name = inspector.username

    # Convert to Read Model
    response = ExtinguisherRead(
        **extinguisher.model_dump(),
        last_inspection_status=status_label,
        next_service_due=service_due,
        last_inspector=inspector_name
    )
    return response

@router.get("/{id}/qr")
async def get_qr_code(id: uuid.UUID, session: Session = Depends(get_session)):
    # ... (existing QR code logic) ...
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
    url = f"{FRONTEND_URL}/scan/{id}" 
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return Response(content=img_byte_arr.getvalue(), media_type="image/png")
