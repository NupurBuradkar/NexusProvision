"""
Role-Based Access Control (RBAC) permission definitions and guards.
"""

from typing import List
from fastapi import HTTPException, status
from app.models.user import User

ROLE_HIERARCHY = {
    "admin": 3,
    "manager": 2,
    "viewer": 1,
}


class RoleChecker:
    """
    FastAPI dependency callable that enforces minimum role or exact role matching.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role in: {self.allowed_roles}, your role is: '{current_user.role}'",
            )
        return current_user


# Pre-configured role guards
require_admin = RoleChecker(["admin"])
require_manager_or_admin = RoleChecker(["admin", "manager"])
require_any_authenticated = RoleChecker(["admin", "manager", "viewer"])
