from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, delete
from database import get_session
from models import User, Extinguisher, Inspection
from auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

@router.post("/reset", status_code=status.HTTP_204_NO_CONTENT)
async def factory_reset(
    confirmation: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Factory Reset: Wipes all Extinguishers and Inspections.
    Keeps Users (Admin/Inspector) intact to allow login.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform a factory reset")
    
    if confirmation != "CONFIRM_RESET":
        raise HTTPException(status_code=400, detail="Invalid confirmation code")

    # Delete all inspections first (foreign key constraint)
    session.exec(delete(Inspection))
    # Delete all extinguishers
    session.exec(delete(Extinguisher))
    
    session.commit()
    return None
