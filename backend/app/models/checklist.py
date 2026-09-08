"""
SQLAlchemy ORM Models for Checklist Templates and Developer Checklist Status.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ChecklistTemplateItem(Base):
    """Catalog of standard onboarding tasks."""
    __tablename__ = "checklist_template_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Dev Environment", nullable=False)
    team = Column(String(100), nullable=True)
    is_required = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class DeveloperChecklistStatus(Base):
    """Instance of an onboarding task tracked per developer."""
    __tablename__ = "developer_checklist_statuses"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    template_item_id = Column(Integer, ForeignKey("checklist_template_items.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Dev Environment", nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    developer = relationship("Developer", back_populates="checklist_tasks")
    template_item = relationship("ChecklistTemplateItem")
