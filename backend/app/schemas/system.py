"""
Pydantic v2 Schemas for Systems Catalog and Access Entitlements.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AccessSystemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(default="Cloud Infrastructure", max_length=100)
    description: Optional[str] = None
    icon_key: str = Field(default="cloud", max_length=50)
    is_active: bool = True


class AccessSystemCreate(AccessSystemBase):
    pass


class AccessSystemRead(AccessSystemBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccessGrantBase(BaseModel):
    developer_id: int
    system_id: int
    access_level: str = Field(default="read", pattern="^(admin|write|read|viewer)$")
    notes: Optional[str] = None


class AccessGrantCreate(AccessGrantBase):
    status: str = Field(default="pending", pattern="^(pending|active)$")


class AccessGrantUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|active|revoked)$")
    access_level: Optional[str] = Field(None, pattern="^(admin|write|read|viewer)$")
    notes: Optional[str] = None


class AccessGrantRead(BaseModel):
    id: int
    developer_id: int
    system_id: int
    granted_by_user_id: Optional[int] = None
    status: str
    access_level: str
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    system: Optional[AccessSystemRead] = None

    model_config = ConfigDict(from_attributes=True)
