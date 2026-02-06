from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Extinguisher, User, Inspection, ExtinguisherRead, ExtinguisherCreate
from auth import oauth2_scheme, SECRET_KEY, ALGORITHM, get_current_user
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/extinguishers", tags=["extinguishers"])

@router.get("/", response_model=List[ExtinguisherRead])
def list_extinguishers(session: Session = Depends(get_session)):
    extinguishers = session.exec(select(Extinguisher).options(selectinload(Extinguisher.inspections))).all()
    return extinguishers


def get_optional_user_from_token(token: Optional[str]) -> Optional[str]:
    """
    Manually decode token to find user, return username or None.
    Does not raise 401, just returns None if invalid.
    """
    if not token:
        return None
    try:
        # Remove 'Bearer ' if present
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

@router.post("/")
def create_extinguisher(
    extinguisher_data: ExtinguisherCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # Check for duplicate SL No
    existing = session.exec(select(Extinguisher).where(Extinguisher.sl_no == extinguisher_data.sl_no)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial Number already exists")
    
    # Convert Create Model to DB Model
    extinguisher = Extinguisher.model_validate(extinguisher_data)
    
    # Generate QR Code URL
    # Assuming frontend URL structure
    base_url = "https://fire-safety-app.com" # Replace with env var in prod
    # But strictly, the QR just needs the ID if the app scans it, or full URL for generic scanners.
    # Requirement: "anyone who has the QR scanner... open... in view mode"
    # So it must be a full URL.
    # For dev: http://localhost:3000
    extinguisher.qr_code_url = f"/extinguisher/{extinguisher.id}"
    
    session.add(extinguisher)
    session.commit()
    session.refresh(extinguisher)
    return extinguisher

@router.get("/{id}")
def get_extinguisher(
    id: str, 
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
):
    ext_uuid = None
    try:
        from uuid import UUID
        ext_uuid = UUID(id)
    except ValueError:
        # Not a UUID, try to interpret as Serial Number
        pass

    # 1. Fetch Extinguisher
    if ext_uuid:
        extinguisher = session.get(Extinguisher, ext_uuid)
    else:
        # Search by Serial Number (Case Insensitive logic would be better, but strict is fine for now if we ensure data matches)
        # Using col(Extinguisher.sl_no).ilike(id) might be db specific.
        # Let's try explicit Python side match if list is small, or just standard query.
        # For robustness, we'll strip whitespace.
        extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip())).first()
        
        # Fallback: try upper case
        if not extinguisher:
             extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip().upper())).first()


    if not extinguisher:
        raise HTTPException(status_code=404, detail="Extinguisher not found")
    
    # Ensure we have the UUID for further logic since logic relies on IDs
    ext_uuid = extinguisher.id

    
    # Determine Mode
    # Default to VIEW
    mode = "VIEW"
    debug_info = []

    # Get User (if any)
    user = get_optional_user_from_token(authorization)
    debug_info.append(f"User: {user}")

    if user:
         # Inspector is viewing. Check for 48h Lock.
         if last_inspection_at:
             # Ensure both are timezone aware or both naive
             now_utc = datetime.utcnow()
             last_insp = last_inspection_at
             
             # If last_insp is timezone aware (Postgres default), make now_utc aware
             if last_insp.tzinfo is not None:
                 from datetime import timezone
                 now_utc = now_utc.replace(tzinfo=timezone.utc)
             
             hours_since = (now_utc - last_insp).total_seconds() / 3600
             debug_info.append(f"Hours since last: {hours_since}")
             if hours_since < 48:
                 # Logic Requirement: Prevent duplicate records by same or other inspector
                 mode = "LOCKED"
             else:
                 mode = "EDIT"
         else:
             mode = "EDIT" # No previous inspection
    
    # If no user (Public), mode stays "VIEW" regardless of lock status
    # This fulfills: "ability to scan... and showcase details... (anyone... view mode)"
    
    # Fetch Last Inspector Name
    last_inspector_name = "N/A"
    next_due_date = extinguisher.next_service_due
    
    if last_inspection:
        # If inspection has specific next due date, use it, else fallback to extinguisher field
        if last_inspection.due_for_refilling:
            # Update the transient variable (or the model if we wanted to persist, but just viewing now)
            next_due_date = last_inspection.due_for_refilling
        
        if last_inspection.inspector_id:
             inspector_user = session.get(User, last_inspection.inspector_id)
             if inspector_user:
                 last_inspector_name = inspector_user.username
             else:
                 last_inspector_name = "Unknown User"
        else:
             last_inspector_name = "System/Legacy"

    # Response
    return {
        **extinguisher.model_dump(),
        "mode": mode,
        "lastInspectionAt": last_inspection_at,
        "last_inspector": last_inspector_name,
        "next_service_due": next_due_date, # Override with latest inspection data if available
        "last_inspection_status": "Operational" if not last_inspection or last_inspection.remarks != "Non-Operational" else "Non-Operational",
        "debug_info": "; ".join(debug_info)
    }
