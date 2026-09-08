"""
Checklist Template and Task Completion Management Router.
"""

from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.checklist import ChecklistTemplateItem, DeveloperChecklistStatus
from app.models.developer import Developer
from app.models.user import User
from app.schemas.checklist import (
    ChecklistTemplateCreate,
    ChecklistTemplateRead,
    DeveloperTaskRead,
    TaskStatusUpdate,
)
from app.dependencies import (
    get_current_user,
    get_current_manager_or_admin,
    get_current_active_admin,
)
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/checklist", tags=["Checklists"])


@router.get("/templates", response_model=List[ChecklistTemplateRead])
def list_checklist_templates(
    team: Optional[str] = Query(None, description="Filter by team"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches checklist template catalog."""
    query = db.query(ChecklistTemplateItem)
    if team:
        query = query.filter(
            or_(ChecklistTemplateItem.team == None, ChecklistTemplateItem.team == team)
        )
    return query.order_by(ChecklistTemplateItem.sort_order.asc()).all()


@router.post("/templates", response_model=ChecklistTemplateRead, status_code=status.HTTP_201_CREATED)
def create_checklist_template(
    payload: ChecklistTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """Creates a new standard checklist template item in the catalog."""
    item = ChecklistTemplateItem(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        team=payload.team,
        is_required=payload.is_required,
        sort_order=payload.sort_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    audit_service.record(
        db=db,
        action="CHECKLIST_TEMPLATE_CREATED",
        target_type="ChecklistTemplateItem",
        target_id=str(item.id),
        actor=current_user,
        details={"title": item.title, "category": item.category, "team": item.team},
    )

    return item


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """Deletes a checklist template item from the catalog."""
    item = db.query(ChecklistTemplateItem).filter(ChecklistTemplateItem.id == template_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template item {template_id} not found",
        )
    db.delete(item)
    db.commit()


@router.patch("/tasks/{task_id}/toggle", response_model=DeveloperTaskRead)
def toggle_developer_task(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggles completion status of a developer's specific checklist task.
    Records completion timestamp and logs compliance audit trail.
    """
    task = db.query(DeveloperChecklistStatus).filter(DeveloperChecklistStatus.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist task with ID {task_id} not found",
        )

    task.is_completed = payload.is_completed
    task.completed_at = datetime.utcnow() if payload.is_completed else None
    if payload.notes is not None:
        task.notes = payload.notes

    db.commit()
    db.refresh(task)

    audit_service.record(
        db=db,
        action="CHECKLIST_TASK_TOGGLED",
        target_type="DeveloperChecklistStatus",
        target_id=str(task.id),
        actor=current_user,
        details={
            "developer_id": task.developer_id,
            "task_title": task.title,
            "is_completed": task.is_completed,
        },
    )

    # Check if developer completed all checklist tasks
    dev_tasks = db.query(DeveloperChecklistStatus).filter(
        DeveloperChecklistStatus.developer_id == task.developer_id
    ).all()
    if dev_tasks and all(t.is_completed for t in dev_tasks):
        dev = db.query(Developer).filter(Developer.id == task.developer_id).first()
        if dev and dev.status != "completed":
            dev.status = "completed"
            db.commit()
            notification_service.notify(
                event_type="DEVELOPER_ONBOARDING_COMPLETED",
                title="Onboarding Checklist Completed",
                message=f"All onboarding checklist tasks completed for {dev.full_name}.",
                metadata={"Developer": dev.full_name, "Team": dev.team},
            )

    return task
