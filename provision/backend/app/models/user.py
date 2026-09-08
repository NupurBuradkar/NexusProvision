"""
SQLAlchemy ORM Model for administrative and managerial users.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="manager", nullable=False)  # "admin", "manager", "viewer"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")
    granted_accesses = relationship("AccessGrant", back_populates="granter", foreign_keys="AccessGrant.granted_by_user_id")
    requested_repos = relationship("RepoRequest", back_populates="requester", foreign_keys="RepoRequest.requested_by_user_id")
