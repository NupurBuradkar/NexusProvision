"""
Authentication & Authorization Router.
Handles JWT token issuance, login verification, token refreshing, and profile fetching.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.developer import Developer
from app.schemas.user import UserRead, UserLogin, Token, EmployeeLoginRequest
from app.auth.security import verify_password, create_access_token, get_password_hash
from app.dependencies import get_current_user
from app.services.audit_service import audit_service
from app.services.onboarding_service import onboarding_service

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

    # If this user is an onboarded developer, link developer_id
    dev = db.query(Developer).filter(Developer.email == user.email).first()
    dev_id = dev.id if dev else None

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id, "developer_id": dev_id}
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
        "developer_id": dev_id,
    }


@router.post("/employee-login", response_model=Token)
def employee_login(
    payload: EmployeeLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Employee Portal Sign-In.
    Authenticates or bootstraps an onboarding engineer with their selected designation.
    """
    email_clean = payload.email.strip().lower()
    dev = db.query(Developer).filter(Developer.email == email_clean).first()

    # Determine team based on designation if not explicitly provided
    team = payload.team
    if not team:
        desig_lower = payload.designation.lower()
        if "frontend" in desig_lower or "ui" in desig_lower:
            team = "Frontend"
        elif "devops" in desig_lower or "sre" in desig_lower or "cloud" in desig_lower:
            team = "DevOps"
        elif "data" in desig_lower or "analytics" in desig_lower:
            team = "Data Platform"
        elif "security" in desig_lower or "secops" in desig_lower:
            team = "Security"
        else:
            team = "Backend"

    if not dev:
        # Auto-create developer record with selected designation
        full_name = payload.full_name or email_clean.split("@")[0].replace(".", " ").title()
        dev = Developer(
            full_name=full_name,
            email=email_clean,
            team=team,
            role_title=payload.designation,
            seniority="Mid-level" if "Senior" not in payload.designation else "Senior",
            status="in_progress",
        )
        db.add(dev)
        db.commit()
        db.refresh(dev)

        # Bootstrap their checklist and default access
        onboarding_service.bootstrap_developer(
            db=db,
            developer=dev,
            auto_checklist=True,
            auto_access=True,
        )
    else:
        # Update designation if provided and different
        if payload.designation and dev.role_title != payload.designation:
            dev.role_title = payload.designation
            db.commit()
            db.refresh(dev)

    # Ensure a corresponding User account exists
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user = User(
            email=email_clean,
            hashed_password=get_password_hash("EmployeePass123!"),
            full_name=dev.full_name,
            role="developer",
            designation=dev.role_title,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": "developer",
            "user_id": user.id,
            "developer_id": dev.id,
            "designation": dev.role_title,
        }
    )

    audit_service.record(
        db=db,
        action="EMPLOYEE_PORTAL_LOGIN",
        target_type="Developer",
        target_id=str(dev.id),
        actor=user,
        details={"email": dev.email, "designation": dev.role_title, "team": dev.team},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "developer_id": dev.id,
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
