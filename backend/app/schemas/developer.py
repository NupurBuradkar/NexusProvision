"""
Pydantic v2 Schemas for Developer lifecycle management and progress metrics.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.schemas.checklist import DeveloperTaskRead
from app.schemas.system import AccessGrantRead
from app.schemas.repo import RepoRequestRead


class DeveloperBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    github_username: Optional[str] = Field(None, max_length=100)
    team: str = Field(..., min_length=2, max_length=100)
    role_title: str = Field(..., min_length=2, max_length=100)
    seniority: str = Field(default="Mid-level", max_length=50)
    status: str = Field(default="in_progress", pattern="^(pre_boarding|in_progress|completed|offboarded)$")
    start_date: Optional[datetime] = None
    notes: Optional[str] = None


class DeveloperCreate(DeveloperBase):
    auto_generate_checklist: bool = True
    auto_grant_default_access: bool = True


class DeveloperUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    github_username: Optional[str] = None
    team: Optional[str] = None
    role_title: Optional[str] = None
    seniority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class DeveloperRead(DeveloperBase):
    id: int
    created_at: datetime
    updated_at: datetime
    checklist_tasks: List[DeveloperTaskRead] = []
    access_grants: List[AccessGrantRead] = []
    repo_requests: List[RepoRequestRead] = []

    model_config = ConfigDict(from_attributes=True)


class DeveloperProgressSummary(BaseModel):
    developer_id: int
    developer_name: str
    status: str
    total_tasks: int
    completed_tasks: int
    task_completion_percentage: float
    total_systems: int
    active_systems: int
    access_completion_percentage: float
    overall_progress_percentage: float
