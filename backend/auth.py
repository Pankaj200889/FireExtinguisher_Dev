# from passlib.context import CryptContext
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional

# CONSTANTS - CHANGE IN PROD
SECRET_KEY = "simplesecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 Day

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed):
    # return pwd_context.verify(plain, hashed)
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(plain.encode('utf-8'), hashed)

def get_password_hash(password):
    # return pwd_context.hash(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from database import get_session
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    try:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
    except Exception as e:
        print(f"AUTH DB ERROR: {e}")
        # If DB error (e.g. missing column), we can't authenticate.
        # But returning 401 hides the 500. Let's return 500 to be honest or log it.
        # For the user, they see 401 usually.
        raise HTTPException(status_code=500, detail="Database Authentication Error")

    if user is None:
        raise credentials_exception
        
    return user
