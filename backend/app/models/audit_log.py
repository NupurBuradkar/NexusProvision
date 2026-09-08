"""
SQLAlchemy ORM Model for SOC2 and ISO compliance audit logging.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    """Immutable audit trail of all mutating operations and authorization decisions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_email = Column(String(255), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)        # e.g., "DEVELOPER_CREATED", "ACCESS_GRANTED"
    target_type = Column(String(100), nullable=False, index=True)   # e.g., "Developer", "AccessGrant", "RepoRequest"
    target_id = Column(String(100), nullable=True, index=True)
    details = Column(Text, nullable=True)                          # JSON payload string
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    actor = relationship("User", back_populates="audit_logs")
