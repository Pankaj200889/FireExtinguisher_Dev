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
    
    # --- SAFE MODE ---
    # Simplified logic to prevent crashes
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info(f"SAFE_GET: Fetching {id}")

    try:
        # 1. basic fetch
        # Search by ID or Serial (using string only to avoid UUID conversion crashes)
        statement = select(Extinguisher).where((Extinguisher.id == id) | (Extinguisher.sl_no == id))
        try:
             # Try UUID conversion if possible for stricter ID match
             as_uuid = uuid.UUID(id)
             statement = select(Extinguisher).where(Extinguisher.id == as_uuid)
        except:
             pass
             
        extinguisher = session.exec(statement).first()
        
        if not extinguisher:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
            
        # 2. Return minimal data first
        return {
            "id": str(extinguisher.id),
            "sl_no": extinguisher.sl_no,
            "location": extinguisher.location,
            "status": extinguisher.status,
            "mode": "VIEW", # Force VIEW for now
            "debug_info": ["Safe Mode Active"]
        }
    except Exception as e:
        logger.error(f"CRASH: {e}")
        return JSONResponse(status_code=500, content={"detail": f"Server Crash: {str(e)}"})        
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
