"""
Compliance and Audit Service.
Records immutable audit entries for all security-relevant and state-mutating actions.
"""

import json
from typing import Optional, Any, List
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    @staticmethod
    def record(
        db: Session,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        actor: Optional[User] = None,
        actor_email: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Creates and persists an immutable audit log entry.
        """
        email = actor.email if actor else (actor_email or "SYSTEM")
        actor_id = actor.id if actor else None
        
        details_str = json.dumps(details, default=str) if details else None

        audit_entry = AuditLog(
            actor_id=actor_id,
            actor_email=email,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            details=details_str,
            ip_address=ip_address,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def get_recent_logs(
        db: Session,
        limit: int = 50,
        target_type: Optional[str] = None,
    ) -> List[AuditLog]:
        """
        Fetches the latest audit events sorted in descending order of occurrence.
        """
        query = db.query(AuditLog)
        if target_type:
            query = query.filter(AuditLog.target_type == target_type)
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()


audit_service = AuditService()
