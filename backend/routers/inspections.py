from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Inspection, Extinguisher, User
from auth import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/inspections", tags=["inspections"])

class InspectionCreate(BaseModel):
    extinguisher_id: str
    inspection_type: str # Quarterly, Annual
    remarks: Optional[str] = None
    pressure_tested_on: Optional[datetime] = None
    refilled_on: Optional[datetime] = None
    due_for_refilling: Optional[datetime] = None
    photo_path: Optional[str] = None
    signature_path: Optional[str] = None
    image_urls: Optional[List[str]] = None # Just in case frontend sends it
    device_id: Optional[str] = None

@router.get("/export")
def export_history(session: Session = Depends(get_session)):
    """
    Export complete inspection history as CSV.
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    # Query all inspections with relations
    # Explicit join condition needed for User as FK might not be inferred due to optionality or missing relationship def
    statement = (
        select(Inspection, User, Extinguisher)
        .join(User, Inspection.inspector_id == User.id, isouter=True)
        .join(Extinguisher, Inspection.extinguisher_id == Extinguisher.id, isouter=True)
        .order_by(Inspection.inspection_date.desc())
    )
    results = session.exec(statement).all()
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Timestamp (UTC)", "Inspector Name", "Inspector ID", "Device ID",
        "Action (Type)", "Extinguisher SN", "Location", "Result", "Remarks"
    ])
    
    for inspection, user, ext in results:
        writer.writerow([
            inspection.inspection_date.isoformat(),
            user.username if user else "Unknown",
            user.id if user else "N/A",
            inspection.device_id or "N/A",
            inspection.inspection_type,
            ext.sl_no if ext else "Deleted Asset",
            ext.location if ext else "N/A",
            inspection.observation or "N/A",
            inspection.remarks or ""
        ])
        
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=audit_log_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return response

@router.post("/")
def create_inspection(
    inspection_data: InspectionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    print(f"Received Inspection: {inspection_data}")
    
    ext_uuid = None
    try:
        from uuid import UUID
        ext_uuid = UUID(inspection_data.extinguisher_id)
    except ValueError:
        # Not a UUID, assume it is a Serial Number
        pass

    # 1. Validate Extinguisher
    if ext_uuid:
         extinguisher = session.get(Extinguisher, ext_uuid)
    else:
         # Try finding by SL No
         extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == inspection_data.extinguisher_id)).first()

    if not extinguisher:
        print(f"Extinguisher not found for ID/SL: {inspection_data.extinguisher_id}")
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Ensure we use the real UUID
    ext_uuid = extinguisher.id
        
    # 2. Create Inspection
    new_inspection = Inspection(
        extinguisher_id=ext_uuid, # Use the UUID object
        inspector_id=current_user.id,
        inspection_type=inspection_data.inspection_type,
        remarks=inspection_data.remarks,
        pressure_tested_on=inspection_data.pressure_tested_on,
        refilled_on=inspection_data.refilled_on,
        due_for_refilling=inspection_data.due_for_refilling,
        photo_path=inspection_data.photo_path,
        signature_path=inspection_data.signature_path,
        device_id=inspection_data.device_id
    )
    
    session.add(new_inspection)
    
    # 3. Update Extinguisher Status
    extinguisher.last_inspection_date = datetime.utcnow()
    
    if inspection_data.inspection_type == "Annual":
        extinguisher.next_service_due = datetime.utcnow() + timedelta(days=365)
    else:
        extinguisher.next_service_due = datetime.utcnow() + timedelta(days=90)
        
    extinguisher.status = "Operational" # Default to Operational on new inspection unless remarks suggest otherwise
    
    session.add(extinguisher)
    session.commit()
    session.refresh(new_inspection)
    
    return new_inspection
