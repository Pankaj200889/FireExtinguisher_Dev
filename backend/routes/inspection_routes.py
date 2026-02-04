from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import List
import uuid

from database import get_session
from models import Inspection, Extinguisher, User
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/inspections", tags=["inspections"])

class InspectionCreate(BaseModel):
    extinguisher_id: uuid.UUID
    inspection_type: str
    remarks: str
    signature_path: str
    photo_path: Optional[str] = None
    image_urls: Optional[List[str]] = [] # Gallery Images
    pressure_tested_on: Optional[datetime] = None
    date_of_discharge: Optional[datetime] = None
    refilled_on: Optional[datetime] = None
    due_for_refilling: Optional[datetime] = None

@router.post("/")
async def submit_inspection(
    inspection: InspectionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check if Extinguisher exists
    extinguisher = session.get(Extinguisher, inspection.extinguisher_id)
    if not extinguisher:
        raise HTTPException(status_code=404, detail="Extinguisher not found")

    # 2. Check 48-Hour Lock Logic
    # Find last inspection for this extinguisher
    statement = select(Inspection).where(Inspection.extinguisher_id == inspection.extinguisher_id).order_by(Inspection.inspection_date.desc())
    last_inspection = session.exec(statement).first()
    
    if last_inspection:
        time_diff = datetime.utcnow() - last_inspection.inspection_date
        if time_diff < timedelta(hours=48):
            unlock_time = last_inspection.inspection_date + timedelta(hours=48)
            raise HTTPException(
                status_code=400, 
                detail=f"Inspection locked. Last inspection was less than 48 hours ago. Available after {unlock_time.isoformat()}"
            )

    # 3. Create Inspection
    db_obj = Inspection(
        extinguisher_id=inspection.extinguisher_id,
        inspector_id=current_user.id,
        inspection_type=inspection.inspection_type,
        remarks=inspection.remarks,
        signature_path=inspection.signature_path,
        photo_path=inspection.photo_path,
        pressure_tested_on=inspection.pressure_tested_on.date() if inspection.pressure_tested_on else None,
        date_of_discharge=inspection.date_of_discharge.date() if inspection.date_of_discharge else None,
        refilled_on=inspection.refilled_on.date() if inspection.refilled_on else None,
        due_for_refilling=inspection.due_for_refilling.date() if inspection.due_for_refilling else None
    )
    
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    # 4. Save Gallery Images
    from models import InspectionImage
    if inspection.image_urls:
        for img_url in inspection.image_urls:
            img_obj = InspectionImage(
                inspection_id=db_obj.id,
                image_url=img_url
            )
            session.add(img_obj)
        session.commit()
    
    # Real-time trigger
    from sockets import manager
    await manager.broadcast(f"update_dashboard")
    
    return db_obj

@router.get("/history/{extinguisher_id}")
async def get_inspection_history(extinguisher_id: uuid.UUID, session: Session = Depends(get_session)):
    statement = select(Inspection).where(Inspection.extinguisher_id == extinguisher_id).order_by(Inspection.inspection_date.desc())
    inspections = session.exec(statement).all()
    return inspections
