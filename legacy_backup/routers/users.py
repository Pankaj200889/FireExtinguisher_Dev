from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import User, UserCreate, UserRead, UserUpdate
from auth import get_current_user, get_password_hash
from utils import validate_password_strength

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[UserRead])
def read_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = session.exec(select(User).where(User.is_active == True).order_by(User.created_at.desc())).all()
    return users

@router.post("/", response_model=UserRead)
def create_user(
    user: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    validate_password_strength(user.password)
    
    # Check if exists
    existing_user = session.exec(select(User).where(User.username == user.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
        
    # db_user = User.from_orm(user)
    # db_user.password_hash = get_password_hash(user.password)
    # Manual instantiation to satisfy required fields
    db_user = User(
        username=user.username,
        role=user.role,
        password_hash=get_password_hash(user.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{id}")
def delete_user(
    id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user_uuid = None
    try:
        user_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = session.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self-deletion
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete your own account")
         
    user.is_active = False
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/{user_id}/reset-password", response_model=UserRead)
def reset_password(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.password:
        validate_password_strength(user_update.password)
        user.password_hash = get_password_hash(user_update.password)
        session.add(user)
        session.commit()
        session.refresh(user)
        
    return user
