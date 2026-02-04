from fastapi import Request
from sqlmodel import Session
from models import AuditLog
from database import engine
import uuid
import json

def create_audit_log(
    user_id: uuid.UUID,
    action: str,
    request: Request = None,
    details: dict = None,
    ip_address: str = None,
    user_agent: str = None
):
    """
    Creates an audit log entry.
    Can be used as a BackgroundTask to avoid blocking the main response.
    """
    with Session(engine) as session:
        # Extract info from request if provided
        final_ip = ip_address
        final_ua = user_agent
        
        if request:
            if not final_ip:
                final_ip = request.client.host
            if not final_ua:
                final_ua = request.headers.get("user-agent")

        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            details=json.dumps(details) if details else None,
            ip_address=final_ip,
            device_info=final_ua
        )
        session.add(log_entry)
        session.commit()
