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
    extinguishers = session.exec(select(Extinguisher).where(Extinguisher.is_active == True).options(selectinload(Extinguisher.inspections)).order_by(Extinguisher.created_at.desc())).all()
    return extinguishers


def get_optional_user_from_token(token: Optional[str]) -> Optional[str]:
    """
    Manually decode token to find user, return username or None.
    Does not raise 401, just returns None if invalid.
    """
    try:
        if not token:
            return None
        
        # Remove 'Bearer ' if present
        if token.lower().startswith("bearer "):
            parts = token.split(" ")
            if len(parts) > 1:
                token = parts[1]
            else:
                return None
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception as e:
        print(f"Token Decode Error: {e}")
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
    import logging
    print(f"DEBUG: get_extinguisher called for ID: {id}")
    
    # --- RESTORED LOGIC WITH SAFETY GUARDS ---
    # We now know connection is good. 
    # We try to fetch everything, but catch specific subsystem failures.
    
    import logging
    # logging.basicConfig(level=logging.INFO) # Already set globally usually
    # logger = logging.getLogger(__name__)

    ext_uuid = None
    try:
        from uuid import UUID
        ext_uuid = UUID(id)
    except ValueError:
        pass

    # 1. Fetch Extinguisher (Critical - must succeed)
    try:
        if ext_uuid:
            extinguisher = session.get(Extinguisher, ext_uuid)
        else:
            extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip())).first()
            if not extinguisher:
                 extinguisher = session.exec(select(Extinguisher).where(Extinguisher.sl_no == id.strip().upper())).first()

        if not extinguisher:
             # Try fallback to string ID if UUID failed earlier but it really was a string ID in DB (rare)
             extinguisher = session.exec(select(Extinguisher).where(Extinguisher.id == id)).first()
             
        if not extinguisher:
            return JSONResponse(status_code=404, content={"detail": "Extinguisher not found"})
        
        # Ensure we have the UUID
        ext_uuid = extinguisher.id
        
        if not extinguisher.is_active:
             return JSONResponse(status_code=404, content={"detail": "Extinguisher not found (Deleted)"})

    except Exception as e:
        print(f"CRASH in Extinguisher Fetch: {e}")
        return JSONResponse(status_code=500, content={"detail": f"Database Error: {str(e)}"})

    mode = "VIEW"
    debug_info = []
    last_inspection = None
    last_inspection_at = None
    last_inspector_name = "N/A"
    next_due_date = extinguisher.next_service_due

    # 2. Get User (Optional - Non-critical)
    user = None
    try:
        user = get_optional_user_from_token(authorization)
        debug_info.append(f"User: {user}")
    except Exception as e:
        debug_info.append(f"Auth Parse Error: {e}")

    # 3. Fetch History (Semi-critical - fails gracefully)
    try:
        statement = select(Inspection).where(Inspection.extinguisher_id == ext_uuid).order_by(Inspection.inspection_date.desc())
        last_inspection = session.exec(statement).first()
        
        if last_inspection:
            last_inspection_at = last_inspection.inspection_date
            
            # Update Next Due Date logic
            if last_inspection.due_for_refilling:
                next_due_date = last_inspection.due_for_refilling
            
            # Try fetch inspector name
            if last_inspection.inspector_id:
                 try:
                    inspector_user = session.get(User, last_inspection.inspector_id)
                    if inspector_user:
                        last_inspector_name = inspector_user.username
                 except:
                    pass
    except Exception as e:
        print(f"Inspection History Failed: {e}")
        debug_info.append(f"History Error: {str(e)}")

    # 4. Logic: Locking (Depends on History)
    try:
        if user:
             # Inspector is viewing
             if last_inspection_at:
                 # Date math
                 now_utc = datetime.utcnow()
                 last_insp = last_inspection_at
                 if last_insp.tzinfo is not None:
                     from datetime import timezone
                     now_utc = now_utc.replace(tzinfo=timezone.utc)
                 
                 hours_since = (now_utc - last_insp).total_seconds() / 3600
                 if hours_since < 48:
                     mode = "LOCKED"
                 else:
                     mode = "EDIT"
             else:
                 mode = "EDIT"
    except Exception as e:
        debug_info.append(f"Lock Logic Error: {e}")
        mode = "EDIT"

    return {
        **extinguisher.model_dump(),
        "id": str(extinguisher.id), # Ensure ID is string
        "mode": mode,
        "last_inspection_date": last_inspection_at,
        "last_inspector_name": last_inspector_name,
        "last_inspection_status": extinguisher.status,
        "next_service_due": next_due_date,
        "debug_info": debug_info
    }




