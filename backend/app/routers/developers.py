"""
Developer Onboarding Resource Router.
CRUD endpoints, search/filtering, and real-time progress calculations.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.developer import Developer
from app.models.user import User
from app.schemas.developer import (
    DeveloperCreate,
    DeveloperRead,
    DeveloperUpdate,
    DeveloperProgressSummary,
)
from app.dependencies import (
    get_current_user,
    get_current_manager_or_admin,
    get_current_active_admin,
)
from app.services.onboarding_service import onboarding_service
from app.services.audit_service import audit_service
from app.utils.pagination import Page, paginate

router = APIRouter(prefix="/developers", tags=["Developers"])


@router.get("", response_model=Page[DeveloperRead])
def list_developers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search name, email or GitHub username"),
    team: Optional[str] = Query(None, description="Filter by engineering team"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves paginated developers with dynamic multi-field search and team/status filters.
    """
    query = db.query(Developer)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Developer.full_name.ilike(search_pattern),
                Developer.email.ilike(search_pattern),
                Developer.github_username.ilike(search_pattern),
            )
        )

    if team:
        query = query.filter(Developer.team == team)

    if status:
        query = query.filter(Developer.status == status)

    query = query.order_by(Developer.created_at.desc())
    items, total, total_pages = paginate(query, page=page, page_size=page_size)

    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=DeveloperRead, status_code=status.HTTP_201_CREATED)
def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """
    Registers a new developer and initiates automated onboarding orchestration:
    - Instantiates role/team checklist tasks
    - Pre-provisions access requests
    - Records compliance audit trail
    """
    # Check duplicate email
    existing = db.query(Developer).filter(Developer.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Developer with email '{payload.email}' already exists.",
        )

    developer = Developer(
        full_name=payload.full_name,
        email=payload.email,
        github_username=payload.github_username,
        team=payload.team,
        role_title=payload.role_title,
        seniority=payload.seniority,
        status=payload.status,
        start_date=payload.start_date,
        notes=payload.notes,
    )
    db.add(developer)
    db.commit()
    db.refresh(developer)

    # Trigger onboarding orchestration
    developer = onboarding_service.bootstrap_developer(
        db=db,
        developer=developer,
        actor=current_user,
        auto_checklist=payload.auto_generate_checklist,
        auto_access=payload.auto_grant_default_access,
    )

    return developer


@router.get("/{developer_id}", response_model=DeveloperRead)
def get_developer_detail(
    developer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves single developer profile with all tasks, grants, and repositories."""
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {developer_id} not found",
        )
    return developer


@router.put("/{developer_id}", response_model=DeveloperRead)
def update_developer(
    developer_id: int,
    payload: DeveloperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """Updates developer metadata (team, role, status, GitHub handle)."""
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {developer_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(developer, field, value)

    db.commit()
    db.refresh(developer)

    audit_service.record(
        db=db,
        action="DEVELOPER_UPDATED",
        target_type="Developer",
        target_id=str(developer.id),
        actor=current_user,
        details=update_data,
    )

    return developer


@router.delete("/{developer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_developer(
    developer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """Permanently deletes a developer record and associated cascading relations."""
    developer = db.query(Developer).filter(Developer.id == developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {developer_id} not found",
        )

    db.delete(developer)
    db.commit()

    audit_service.record(
        db=db,
        action="DEVELOPER_DELETED",
        target_type="Developer",
        target_id=str(developer_id),
        actor=current_user,
        details={"name": developer.full_name, "email": developer.email},
    )


@router.get("/{developer_id}/progress", response_model=DeveloperProgressSummary)
def get_developer_onboarding_progress(
    developer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculates weighted onboarding completion metrics and task velocity."""
    try:
        return onboarding_service.calculate_progress(db=db, developer_id=developer_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
