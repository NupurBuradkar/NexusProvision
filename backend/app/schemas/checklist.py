"""
Pydantic v2 Schemas for Checklist Templates and Task Statuses.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ChecklistTemplateBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: str = Field(default="Dev Environment", max_length=100)
    team: Optional[str] = Field(default=None, max_length=100)
    is_required: bool = True
    sort_order: int = 0


class ChecklistTemplateCreate(ChecklistTemplateBase):
    pass


class ChecklistTemplateRead(ChecklistTemplateBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeveloperTaskRead(BaseModel):
    id: int
    developer_id: int
    template_item_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStatusUpdate(BaseModel):
    is_completed: bool
    notes: Optional[str] = None
