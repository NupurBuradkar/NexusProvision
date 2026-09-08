"""
Authentication & Authorization Router.
Handles JWT token issuance, login verification, token refreshing, and profile fetching.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserLogin, Token
from app.auth.security import verify_password, create_access_token
from app.dependencies import get_current_user
from app.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login_json_or_form(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Standard JSON authentication endpoint. Validates email and password,
    issuing a signed JWT bearer token on success.
    """
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )

    audit_service.record(
        db=db,
        action="USER_LOGIN_SUCCESS",
        target_type="User",
        target_id=str(user.id),
        actor=user,
        details={"email": user.email, "role": user.role},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/token", response_model=Token, include_in_schema=False)
def login_oauth2_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 Password Request Form endpoint for Swagger UI authorization integration.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns the authenticated user's account details and roles."""
    return current_user


@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user: User = Depends(get_current_user),
):
    """Issues a refreshed JWT token for the currently authenticated session."""
    new_token = create_access_token(
        data={"sub": current_user.email, "role": current_user.role, "user_id": current_user.id}
    )
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user": current_user,
    }
