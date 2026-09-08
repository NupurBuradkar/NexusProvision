"""
SQLAlchemy ORM Model for developers undergoing onboarding.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Developer(Base):
    __tablename__ = "developers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    github_username = Column(String(100), nullable=True, index=True)
    team = Column(String(100), nullable=False, index=True)  # e.g. "Backend", "Frontend", "DevOps", "Data Platform", "Security"
    role_title = Column(String(100), nullable=False)        # e.g. "Senior Platform Engineer"
    seniority = Column(String(50), default="Mid-level")     # "Junior", "Mid-level", "Senior", "Staff", "Lead"
    status = Column(String(50), default="in_progress", index=True)  # "pre_boarding", "in_progress", "completed", "offboarded"
    start_date = Column(DateTime, default=utc_now, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships with cascade delete
    checklist_tasks = relationship("DeveloperChecklistStatus", back_populates="developer", cascade="all, delete-orphan", lazy="selectin")
    access_grants = relationship("AccessGrant", back_populates="developer", cascade="all, delete-orphan", lazy="selectin")
    repo_requests = relationship("RepoRequest", back_populates="developer", cascade="all, delete-orphan", lazy="selectin")
