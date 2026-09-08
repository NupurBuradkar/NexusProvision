"""
Onboarding Business Logic Service.
Handles bootstrapping checklists, default entitlement grants, progress calculations, and milestone alerts.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.developer import Developer
from app.models.checklist import ChecklistTemplateItem, DeveloperChecklistStatus
from app.models.system import AccessSystem, AccessGrant
from app.models.user import User
from app.schemas.developer import DeveloperProgressSummary
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service


class OnboardingService:
    @staticmethod
    def bootstrap_developer(
        db: Session,
        developer: Developer,
        actor: Optional[User] = None,
        auto_checklist: bool = True,
        auto_access: bool = True,
    ) -> Developer:
        """
        Orchestrates initial provisioning tasks when a new developer is registered.
        """
        # 1. Instantiate Checklist items from templates
        if auto_checklist:
            templates = db.query(ChecklistTemplateItem).filter(
                or_(
                    ChecklistTemplateItem.team == None,  # General tasks
                    ChecklistTemplateItem.team == developer.team,  # Team-specific tasks
                )
            ).order_by(ChecklistTemplateItem.sort_order.asc()).all()

            for tmpl in templates:
                task = DeveloperChecklistStatus(
                    developer_id=developer.id,
                    template_item_id=tmpl.id,
                    title=tmpl.title,
                    description=tmpl.description,
                    category=tmpl.category,
                    is_completed=False,
                )
                db.add(task)

        # 2. Instantiate Default System Access Grants in pending state
        if auto_access:
            systems = db.query(AccessSystem).filter(AccessSystem.is_active == True).all()
            for sys in systems:
                grant = AccessGrant(
                    developer_id=developer.id,
                    system_id=sys.id,
                    granted_by_user_id=actor.id if actor else None,
                    status="pending",
                    access_level="read",
                    notes=f"Default onboarding request for {developer.team} team",
                )
                db.add(grant)

        db.commit()
        db.refresh(developer)

        # 3. Log SOC2 Audit Trail
        audit_service.record(
            db=db,
            action="DEVELOPER_ONBOARDED",
            target_type="Developer",
            target_id=str(developer.id),
            actor=actor,
            details={
                "email": developer.email,
                "team": developer.team,
                "role_title": developer.role_title,
                "auto_checklist": auto_checklist,
                "auto_access": auto_access,
            },
        )

        # 4. Trigger Notification
        notification_service.notify(
            event_type="DEVELOPER_ONBOARDED",
            title="New Developer Onboarding Started",
            message=f"{developer.full_name} ({developer.role_title}) joined team {developer.team}.",
            metadata={
                "Developer": developer.full_name,
                "Team": developer.team,
                "Email": developer.email,
            },
        )

        return developer

    @staticmethod
    def calculate_progress(db: Session, developer_id: int) -> DeveloperProgressSummary:
        """
        Calculates aggregate checklist and access entitlement completion percentages.
        """
        developer = db.query(Developer).filter(Developer.id == developer_id).first()
        if not developer:
            raise ValueError(f"Developer with ID {developer_id} not found")

        tasks = developer.checklist_tasks
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.is_completed)
        task_pct = (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 0.0

        grants = developer.access_grants
        total_systems = len(grants)
        active_systems = sum(1 for g in grants if g.status == "active")
        access_pct = (active_systems / total_systems * 100.0) if total_systems > 0 else 0.0

        # Weighted composite score: 60% checklist tasks, 40% system access
        overall = (task_pct * 0.6) + (access_pct * 0.4)

        return DeveloperProgressSummary(
            developer_id=developer.id,
            developer_name=developer.full_name,
            status=developer.status,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            task_completion_percentage=round(task_pct, 1),
            total_systems=total_systems,
            active_systems=active_systems,
            access_completion_percentage=round(access_pct, 1),
            overall_progress_percentage=round(overall, 1),
        )


onboarding_service = OnboardingService()
