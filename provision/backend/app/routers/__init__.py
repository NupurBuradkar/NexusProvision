"""
API Routers Package.
Exports all resource routers.
"""

from app.routers.auth import router as auth_router
from app.routers.developers import router as developers_router
from app.routers.checklist import router as checklist_router
from app.routers.access import router as access_router
from app.routers.repos import router as repos_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "developers_router",
    "checklist_router",
    "access_router",
    "repos_router",
    "dashboard_router",
]
