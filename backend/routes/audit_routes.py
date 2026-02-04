from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import AuditLog, User
from auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogPublic(BaseModel):
    id: str
    action: str
    username: str
    role: str
    timestamp: datetime
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    details: Optional[str] = None

@router.get("/", response_model=List[AuditLogPublic])
async def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Fetch audit logs. Restricted to Admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Join with User table to get usernames
    statement = select(AuditLog, User).join(User).order_by(AuditLog.timestamp.desc()).limit(limit)
    results = session.exec(statement).all()
    
    logs = []
    for log, user in results:
        logs.append(AuditLogPublic(
            id=str(log.id),
            action=log.action,
            username=user.username,
            role=user.role,
            timestamp=log.timestamp,
            ip_address=log.ip_address,
            device_info=log.device_info,
            details=log.details
        ))
        
    return logs
