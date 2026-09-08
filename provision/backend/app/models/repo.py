"""
SQLAlchemy ORM Model for automated GitHub repository provisioning requests.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class RepoRequest(Base):
    """Developer repository provisioning request and lifecycle state."""
    __tablename__ = "repo_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    visibility = Column(String(50), default="private", nullable=False)
    status = Column(String(50), default="pending", nullable=False, index=True)
    github_url = Column(String(255), nullable=True)
    branch_protection_enabled = Column(Boolean, default=True, nullable=False)
    template_repo = Column(String(100), nullable=True)
    
    developer_id = Column(Integer, ForeignKey("developers.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    provisioned_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    developer = relationship("Developer", back_populates="repo_requests")
    requester = relationship("User", back_populates="requested_repos")
