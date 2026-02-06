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
    extinguishers = session.exec(select(Extinguisher).where(Extinguisher.is_active == True).options(selectinload(Extinguisher.inspections))).all()
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
            parts = token.split(" ")
            if len(parts) > 1:
                token = parts[1]
            else:
                return None
        
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

    # Wrap entire logic in try/catch to debug 500 errors
    try:
        # 1. Fetch Extinguisher
        if ext_uuid:
            extinguisher = session.get(Extinguisher, ext_uuid)
        else:
            # Search by Serial Number
            extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip())).first()
            if not extinguisher:
                 extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip().upper())).first()

        if not extinguisher:
            return JSONResponse(status_code=404, content={"detail": "Extinguisher not found"})
        
        # Ensure we have the UUID for further logic since logic relies on IDs
        ext_uuid = extinguisher.id
        ext_uuid_str = str(ext_uuid)

        # Determine Mode
        if mode == "maintenance":
             # In maintenance mode, we might want to see even inactive ones? For now, standard rule applies.
             pass
             
        if not extinguisher.is_active:
             return JSONResponse(status_code=404, content={"detail": "Extinguisher not found (Deleted)"})

        mode = "VIEW"
        debug_info = []

        # Get User (if any)
        user = get_optional_user_from_token(authorization)
        debug_info.append(f"User: {user}")

        # Check 48h Lock (Need last inspection regardless of user)
        statement = select(Inspection).where(Inspection.extinguisher_id == ext_uuid).order_by(Inspection.inspection_date.desc())
        last_inspection = session.exec(statement).first()
        last_inspection_at = last_inspection.inspection_date if last_inspection else None

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
                     mode = "LOCKED"
                 else:
                     mode = "EDIT"
             else:
                 mode = "EDIT" # No previous inspection
        
        # If no user (Public), mode stays "VIEW" regardless of lock status

        # Fetch Last Inspector Name
        last_inspector_name = "N/A"
        next_due_date = extinguisher.next_service_due
        
        if last_inspection:
            if last_inspection.due_for_refilling:
                next_due_date = last_inspection.due_for_refilling
            
            if last_inspection.inspector_id:
                 inspector_user = session.get(User, last_inspection.inspector_id)
                 if inspector_user:
                     last_inspector_name = inspector_user.username

        # Response
        return {
            **extinguisher.model_dump(),
            "mode": mode,
            "last_inspection_date": last_inspection.inspection_date if last_inspection else None,
            "last_inspector_name": last_inspector_name,
            "last_inspection_status": extinguisher.status, # Frontend expects this alias
            "next_service_due": next_due_date,
            "debug_info": debug_info
        }

    except Exception as e:
        import traceback
        error_msg = f"CRASH: {str(e)} | {traceback.format_exc()}"
        print(error_msg)
        # Return 200 with error info so frontend displays it instead of Network Error
        return JSONResponse(status_code=500, content={"detail": error_msg})
