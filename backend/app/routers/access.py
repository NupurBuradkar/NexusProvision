"""
Access Systems & Entitlement Grants Router.
Provides systems catalog and grant/revocation endpoints with full audit trail.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.system import AccessSystem, AccessGrant
from app.models.developer import Developer
from app.models.user import User
from app.schemas.system import (
    AccessSystemCreate,
    AccessSystemRead,
    AccessGrantCreate,
    AccessGrantUpdate,
    AccessGrantRead,
)
from app.dependencies import (
    get_current_user,
    get_current_manager_or_admin,
    get_current_active_admin,
)
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/access", tags=["Access & Entitlements"])


@router.get("/systems", response_model=List[AccessSystemRead])
def list_systems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all active systems available for provisioning."""
    return db.query(AccessSystem).filter(AccessSystem.is_active == True).all()


@router.post("/systems", response_model=AccessSystemRead, status_code=status.HTTP_201_CREATED)
def create_system(
    payload: AccessSystemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """Adds a new system or cloud service to the enterprise catalog."""
    existing = db.query(AccessSystem).filter(AccessSystem.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"System '{payload.name}' already exists.",
        )

    system = AccessSystem(
        name=payload.name,
        category=payload.category,
        description=payload.description,
        icon_key=payload.icon_key,
        is_active=payload.is_active,
    )
    db.add(system)
    db.commit()
    db.refresh(system)

    audit_service.record(
        db=db,
        action="ACCESS_SYSTEM_CREATED",
        target_type="AccessSystem",
        target_id=str(system.id),
        actor=current_user,
        details={"name": system.name, "category": system.category},
    )

    return system


@router.get("/grants", response_model=List[AccessGrantRead])
def list_access_grants(
    developer_id: Optional[int] = Query(None, description="Filter by developer ID"),
    status: Optional[str] = Query(None, description="Filter by grant status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists access grants with optional developer or status filtering."""
    query = db.query(AccessGrant)
    if developer_id:
        query = query.filter(AccessGrant.developer_id == developer_id)
    if status:
        query = query.filter(AccessGrant.status == status)
    return query.order_by(AccessGrant.created_at.desc()).all()


@router.post("/grants", response_model=AccessGrantRead, status_code=status.HTTP_201_CREATED)
def create_access_grant(
    payload: AccessGrantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """Grants or requests access to a system for a specific developer."""
    developer = db.query(Developer).filter(Developer.id == payload.developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {payload.developer_id} not found",
        )

    system = db.query(AccessSystem).filter(AccessSystem.id == payload.system_id).first()
    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Access system with ID {payload.system_id} not found",
        )

    # Check if grant already exists
    existing = db.query(AccessGrant).filter(
        AccessGrant.developer_id == payload.developer_id,
        AccessGrant.system_id == payload.system_id,
    ).first()

    if existing:
        # Re-activate if revoked
        existing.status = payload.status
        existing.access_level = payload.access_level
        existing.granted_by_user_id = current_user.id
        existing.granted_at = datetime.utcnow() if payload.status == "active" else None
        existing.notes = payload.notes or existing.notes
        db.commit()
        db.refresh(existing)
        grant = existing
    else:
        grant = AccessGrant(
            developer_id=payload.developer_id,
            system_id=payload.system_id,
            granted_by_user_id=current_user.id,
            status=payload.status,
            access_level=payload.access_level,
            granted_at=datetime.utcnow() if payload.status == "active" else None,
            notes=payload.notes,
        )
        db.add(grant)
        db.commit()
        db.refresh(grant)

    audit_service.record(
        db=db,
        action="ACCESS_GRANTED" if payload.status == "active" else "ACCESS_REQUESTED",
        target_type="AccessGrant",
        target_id=str(grant.id),
        actor=current_user,
        details={
            "developer": developer.full_name,
            "system": system.name,
            "access_level": grant.access_level,
            "status": grant.status,
        },
    )

    return grant


@router.patch("/grants/{grant_id}", response_model=AccessGrantRead)
def update_access_grant(
    grant_id: int,
    payload: AccessGrantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """Updates access grant status (e.g. approve to 'active' or 'revoked')."""
    grant = db.query(AccessGrant).filter(AccessGrant.id == grant_id).first()
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Access grant {grant_id} not found",
        )

    if payload.status:
        grant.status = payload.status
        if payload.status == "active":
            grant.granted_at = datetime.utcnow()
            grant.granted_by_user_id = current_user.id
        elif payload.status == "revoked":
            grant.revoked_at = datetime.utcnow()

    if payload.access_level:
        grant.access_level = payload.access_level

    if payload.notes is not None:
        grant.notes = payload.notes

    db.commit()
    db.refresh(grant)

    audit_service.record(
        db=db,
        action=f"ACCESS_{grant.status.upper()}",
        target_type="AccessGrant",
        target_id=str(grant.id),
        actor=current_user,
        details={
            "developer_id": grant.developer_id,
            "system_id": grant.system_id,
            "new_status": grant.status,
            "access_level": grant.access_level,
        },
    )

    return grant
