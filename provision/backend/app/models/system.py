"""
SQLAlchemy ORM Models for Access Systems Catalog and Developer Entitlement Grants.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AccessSystem(Base):
    """Catalog of enterprise systems, cloud platforms, and internal services."""
    __tablename__ = "access_systems"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), default="Cloud Infrastructure", nullable=False)
    description = Column(Text, nullable=True)
    icon_key = Column(String(50), default="cloud", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class AccessGrant(Base):
    """Specific system entitlement grant for a developer, complete with audit trail."""
    __tablename__ = "access_grants"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    system_id = Column(Integer, ForeignKey("access_systems.id", ondelete="CASCADE"), nullable=False, index=True)
    granted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # "pending", "active", "revoked"
    access_level = Column(String(50), default="read", nullable=False)           # "admin", "write", "read", "viewer"
    granted_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    developer = relationship("Developer", back_populates="access_grants")
    system = relationship("AccessSystem", lazy="joined")
    granter = relationship("User", back_populates="granted_accesses")
