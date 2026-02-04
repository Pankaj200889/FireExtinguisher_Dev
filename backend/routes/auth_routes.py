from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from database import get_session
from models import User
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
    User
)
from pydantic import BaseModel
from fastapi import Request, BackgroundTasks
from audit_logger import create_audit_log

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "inspector"

class UserPublic(BaseModel):
    id: str | None = None
    username: str
    email: str
    role: str

router = APIRouter(tags=["auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Audit Log
    create_audit_log(
        user_id=user.id,
        action="LOGIN",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserPublic)
async def register(user: UserCreate, session: Session = Depends(get_session)):
    # Check existing
    statement = select(User).where((User.username == user.username) | (User.email == user.email))
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return UserPublic(id=str(db_user.id), username=db_user.username, email=db_user.email, role=db_user.role)

@router.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserPublic(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role
    )
