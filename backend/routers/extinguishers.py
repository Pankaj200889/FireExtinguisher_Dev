from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Extinguisher, User, Inspection, ExtinguisherRead
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
    extinguisher: Extinguisher,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # Generate ID if not provided (though model has default factory)
    # We enforce new ID to avoid collisions if user sends one
    # extinguisher.id = uuid.uuid4() # Let SQLModel handle it or ensure uniqueness
    
    # Check for duplicate SL No
    existing = session.exec(select(Extinguisher).where(Extinguisher.sl_no == extinguisher.sl_no)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial Number already exists")
    
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

    
    # 2. Determine Mode
    # Default to VIEW
    mode = "VIEW"
    debug_info = []

    # Check 48h Lock
    # Logic: Find latest inspection
    # Assuming we want the absolute latest inspection for this item
    statement = select(Inspection).where(Inspection.extinguisher_id == ext_uuid).order_by(Inspection.inspection_date.desc())
    last_inspection = session.exec(statement).first()
    
    last_inspection_at = last_inspection.inspection_date if last_inspection else None
    
    if last_inspection_at:
        hours_since = (datetime.utcnow() - last_inspection_at).total_seconds() / 3600
        debug_info.append(f"Hours since last: {hours_since}")
        if hours_since < 48:
            mode = "LOCKED"
    
    # If not locked, check for Inspector Access
    if mode != "LOCKED":
        user = get_optional_user_from_token(authorization)
        debug_info.append(f"User: {user}")
        if user:
            mode = "EDIT"
    
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
