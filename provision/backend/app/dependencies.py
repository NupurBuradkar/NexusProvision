"""
Reusable FastAPI Dependencies for DB sessions, user authentication, and RBAC enforcement.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.auth.security import decode_access_token
from app.models.user import User

# OAuth2 password bearer scheme pointing to login route
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Decodes the JWT Bearer token and retrieves the current authenticated User.
    Raises HTTP 401 if token is missing, invalid, or user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_email: str = payload.get("sub")
    if user_email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Requires current user to have 'admin' role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required for this action",
        )
    return current_user


def get_current_manager_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Requires current user to have either 'manager' or 'admin' role."""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or Admin privileges required for this action",
        )
    return current_user
