"""
Dashboard & Analytics Aggregation Router.
Provides high-level KPIs, team velocities, pending tasks, and recent audit activity.
"""

from typing import Dict, Any, List
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.developer import Developer
from app.models.checklist import DeveloperChecklistStatus
from app.models.system import AccessGrant
from app.models.repo import RepoRequest
from app.models.audit_log import AuditLog
from app.models.user import User
from app.dependencies import get_current_user
from app.services.notification_service import notification_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/stats")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Computes real-time executive dashboard KPIs for engineering onboarding velocity.
    """
    # 1. Developer Metrics
    total_developers = db.query(Developer).count()
    active_onboardings = db.query(Developer).filter(
        Developer.status.in_(["pre_boarding", "in_progress"])
    ).count()
    completed_onboardings = db.query(Developer).filter(Developer.status == "completed").count()

    # 2. Checklist Completion Metrics
    total_tasks = db.query(DeveloperChecklistStatus).count()
    completed_tasks = db.query(DeveloperChecklistStatus).filter(
        DeveloperChecklistStatus.is_completed == True
    ).count()
    checklist_completion_rate = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

    # 3. Access Entitlement Metrics
    total_grants = db.query(AccessGrant).count()
    pending_grants = db.query(AccessGrant).filter(AccessGrant.status == "pending").count()
    active_grants = db.query(AccessGrant).filter(AccessGrant.status == "active").count()

    # 4. Repository Metrics
    total_repos = db.query(RepoRequest).count()
    ready_repos = db.query(RepoRequest).filter(RepoRequest.status == "ready").count()
    pending_repos = db.query(RepoRequest).filter(RepoRequest.status == "pending").count()

    # 5. Team Distribution Breakdown
    teams_query = db.query(Developer.team, func.count(Developer.id)).group_by(Developer.team).all()
    team_breakdown = {team: count for team, count in teams_query}

    # 6. Recent Audit Events
    audit_records = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()
    audit_logs = []
    for log in audit_records:
        parsed_details = None
        if log.details:
            try:
                parsed_details = json.loads(log.details)
            except Exception:
                parsed_details = log.details

        audit_logs.append({
            "id": log.id,
            "actor_email": log.actor_email or "SYSTEM",
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": parsed_details,
            "timestamp": log.timestamp.isoformat(),
        })

    return {
        "kpis": {
            "total_developers": total_developers,
            "active_onboardings": active_onboardings,
            "completed_onboardings": completed_onboardings,
            "checklist_completion_rate": checklist_completion_rate,
            "pending_access_requests": pending_grants,
            "active_access_grants": active_grants,
            "total_repos_provisioned": ready_repos,
            "pending_repos": pending_repos,
        },
        "team_breakdown": team_breakdown,
        "recent_audit_logs": audit_logs,
        "notifications": notification_service.notification_history[:5],
    }


@router.get("/audit", tags=["Compliance & Audit"])
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieves compliance audit logs with parsed JSON details."""
    records = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for log in records:
        details_data = None
        if log.details:
            try:
                details_data = json.loads(log.details)
            except Exception:
                details_data = log.details

        results.append({
            "id": log.id,
            "actor_id": log.actor_id,
            "actor_email": log.actor_email or "SYSTEM",
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": details_data,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        })
    return results
