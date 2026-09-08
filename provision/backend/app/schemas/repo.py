"""
Pydantic v2 Schemas for Repository Provisioning Requests.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RepoRequestBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, pattern="^[a-zA-Z0-9_.-]+$")
    description: Optional[str] = None
    visibility: str = Field(default="private", pattern="^(private|internal|public)$")
    branch_protection_enabled: bool = True
    template_repo: Optional[str] = None


class RepoRequestCreate(RepoRequestBase):
    developer_id: int


class RepoRequestRead(RepoRequestBase):
    id: int
    developer_id: int
    requested_by_user_id: Optional[int] = None
    status: str
    github_url: Optional[str] = None
    provisioned_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RepoProvisionTrigger(BaseModel):
    add_developer_as_collaborator: bool = True
    permission: str = Field(default="admin", pattern="^(admin|push|pull)$")
