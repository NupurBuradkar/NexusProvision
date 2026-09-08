"""
GitHub Repository Provisioning Router.
Handles repo requests, automated repository creation, collaborator grants, and branch protection.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.repo import RepoRequest
from app.models.developer import Developer
from app.models.user import User
from app.schemas.repo import RepoRequestCreate, RepoRequestRead, RepoProvisionTrigger
from app.dependencies import (
    get_current_user,
    get_current_manager_or_admin,
)
from app.services.github_service import github_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/repos", tags=["Repository Provisioning"])


@router.get("", response_model=List[RepoRequestRead])
def list_repositories(
    developer_id: Optional[int] = Query(None, description="Filter by developer ID"),
    status: Optional[str] = Query(None, description="Filter by repo status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists repository provisioning requests."""
    query = db.query(RepoRequest)
    if developer_id:
        query = query.filter(RepoRequest.developer_id == developer_id)
    if status:
        query = query.filter(RepoRequest.status == status)
    return query.order_by(RepoRequest.created_at.desc()).all()


@router.post("", response_model=RepoRequestRead, status_code=status.HTTP_201_CREATED)
def request_repository(
    payload: RepoRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submits a new repository request for a developer."""
    developer = db.query(Developer).filter(Developer.id == payload.developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {payload.developer_id} not found",
        )

    # Check for duplicate repo request for this developer
    existing = db.query(RepoRequest).filter(
        RepoRequest.developer_id == payload.developer_id,
        RepoRequest.name == payload.name,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Repository '{payload.name}' already requested for this developer.",
        )

    repo_request = RepoRequest(
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        status="pending",
        branch_protection_enabled=payload.branch_protection_enabled,
        template_repo=payload.template_repo,
        developer_id=payload.developer_id,
        requested_by_user_id=current_user.id,
    )
    db.add(repo_request)
    db.commit()
    db.refresh(repo_request)

    audit_service.record(
        db=db,
        action="REPO_REQUESTED",
        target_type="RepoRequest",
        target_id=str(repo_request.id),
        actor=current_user,
        details={
            "repo_name": repo_request.name,
            "developer": developer.full_name,
            "visibility": repo_request.visibility,
        },
    )

    return repo_request


@router.post("/{repo_id}/provision", response_model=RepoRequestRead)
def trigger_repository_provisioning(
    repo_id: int,
    trigger: RepoProvisionTrigger = RepoProvisionTrigger(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """
    Executes automated repository provisioning:
    1. Creates repository in GitHub Organization / Account
    2. Adds developer as collaborator (Admin/Push)
    3. Configures branch protection rules on 'main'
    4. Updates database status to 'ready'
    """
    repo = db.query(RepoRequest).filter(RepoRequest.id == repo_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository request {repo_id} not found",
        )

    developer = db.query(Developer).filter(Developer.id == repo.developer_id).first()
    if not developer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Developer with ID {repo.developer_id} not found",
        )

    # Set status to provisioning
    repo.status = "provisioning"
    db.commit()

    try:
        collab_user = developer.github_username if trigger.add_developer_as_collaborator else None
        result = github_service.provision_repository(
            repo_name=repo.name,
            description=repo.description,
            visibility=repo.visibility,
            developer_github_username=collab_user,
            enable_branch_protection=repo.branch_protection_enabled,
        )

        repo.status = "ready"
        repo.github_url = result.get("github_url")
        repo.provisioned_at = datetime.now(timezone.utc)
        repo.error_message = None
        db.commit()
        db.refresh(repo)

        audit_service.record(
            db=db,
            action="REPO_PROVISIONED",
            target_type="RepoRequest",
            target_id=str(repo.id),
            actor=current_user,
            details={
                "repo_name": repo.name,
                "github_url": repo.github_url,
                "collaborator": collab_user,
                "mode": result.get("mode"),
            },
        )

        notification_service.notify(
            event_type="REPO_PROVISIONED",
            title="Repository Provisioned Successfully",
            message=f"Repository '{repo.name}' was created and configured for {developer.full_name}.",
            metadata={"Repo": repo.name, "URL": repo.github_url or ""},
        )

        return repo

    except Exception as e:
        repo.status = "failed"
        repo.error_message = str(e)
        db.commit()
        db.refresh(repo)

        audit_service.record(
            db=db,
            action="REPO_PROVISION_FAILED",
            target_type="RepoRequest",
            target_id=str(repo.id),
            actor=current_user,
            details={"error": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Repository provisioning failed: {str(e)}",
        )
