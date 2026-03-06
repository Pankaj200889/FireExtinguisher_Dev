from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database import get_session
from models import User, PasswordResetToken
from auth import verify_password, create_access_token, get_current_user, get_password_hash
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta

router = APIRouter(tags=["auth"])

class GenerateResetLinkRequest(BaseModel):
    user_id: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    # Fetch user
    print(f"Login attempt for: {form_data.username}")
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    
    if not user:
        print("User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    print(f"User found: {user.username}, Role: {user.role}")
    if not verify_password(form_data.password, user.password_hash):
        print("Password mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Create token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/password-reset-link")
def generate_reset_link(
    request: GenerateResetLinkRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Admin Authorization
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can generate reset links")
        
    # 2. Validate Target User
    try:
        user_uuid = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
        
    target_user = session.get(User, user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 3. Generate Token
    # Invalidate old unused tokens for this user? Optional but good practice.
    # statement = select(PasswordResetToken).where(PasswordResetToken.user_id == user_uuid, PasswordResetToken.is_used == False)
    # existing_tokens = session.exec(statement).all()
    # for t in existing_tokens:
    #     t.is_used = True # Or delete
    #     session.add(t)
    
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    db_token = PasswordResetToken(
        user_id=target_user.id,
        token=reset_token,
        expires_at=expires_at
    )
    session.add(db_token)
    session.commit()
    
    # 4. Return Link
    # Frontend URL - assuming generic structure for now, can be configured via env var
    # If app is at fire.siddhiss.com, reset page is fire.siddhiss.com/reset-password
    # We return the RELATIVE path or full URL if we knew the domain.
    # Let's return the full token so frontend can construct the link.
    
    return {
        "status": "success",
        "message": "Reset link generated successfully",
        "link_token": reset_token,
        "expires_at": expires_at,
        "valid_for": "1 hour"
    }

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    # 1. Find Token
    statement = select(PasswordResetToken).where(
        PasswordResetToken.token == request.token,
        PasswordResetToken.is_used == False
    )
    token_record = session.exec(statement).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or used token")
        
    # 2. Check Expiry
    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Token expired")
        
    # 3. Update User Password
    user = session.get(User, token_record.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User associated with token not found")
        
    user.password_hash = get_password_hash(request.new_password)
    session.add(user)
    
    # 4. Invalidate Token
    token_record.is_used = True
    session.add(token_record)
    
    session.commit()
    
    return {"status": "success", "message": "Password updated successfully"}
