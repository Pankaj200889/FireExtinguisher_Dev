import re
from fastapi import HTTPException, status

def validate_password_strength(password: str):
    """
    Enforces password complexity:
    - At least 8 characters
    - At least 1 number
    - At least 1 special character
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )
        
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%...)."
        )
    
    return True
