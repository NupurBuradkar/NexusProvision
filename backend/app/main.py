"""
FastAPI Application Factory.
Configures CORS, lifespan events, database seeding, and mounts all API v1 routers.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, SessionLocal, Base
import app.models  # Ensures all ORM models are registered with Base metadata
from app.models.user import User
from app.models.checklist import ChecklistTemplateItem
from app.models.system import AccessSystem
from app.models.developer import Developer
from app.models.checklist import DeveloperChecklistStatus
from app.models.system import AccessGrant
from app.models.repo import RepoRequest
from app.auth.security import get_password_hash
from app.routers import (
    auth_router,
    developers_router,
    checklist_router,
    access_router,
    repos_router,
    dashboard_router,
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("seqa.main")


def seed_database(db: Session):
    """
    Seeds initial system catalog, checklist templates, and default admin user
    if the database is currently unpopulated.
    """
    # 1. Seed Initial Superuser / Admin
    admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if not admin_user:
        logger.info(f"Seeding superuser: {settings.FIRST_SUPERUSER_EMAIL}")
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin)

        # Also add a Manager user for testing RBAC
        manager = User(
            email="manager@seqa.dev",
            hashed_password=get_password_hash("ManagerPass123!"),
            full_name="Sarah Jenkins (Engineering Manager)",
            role="manager",
            is_active=True,
        )
        db.add(manager)

    # 2. Seed Default Systems Catalog
    if db.query(AccessSystem).count() == 0:
        logger.info("Seeding default systems catalog...")
        default_systems = [
            AccessSystem(
                name="AWS Cloud Platform",
                category="Cloud Infrastructure",
                description="AWS IAM SSO / Organization access for staging and production environments.",
                icon_key="aws",
            ),
            AccessSystem(
                name="GitHub Organization",
                category="Source Control",
                description="Access to private repos, organization teams, and CI/CD actions.",
                icon_key="github",
            ),
            AccessSystem(
                name="Slack Workspace",
                category="Communication",
                description="Company communication, team channels, and alert feeds.",
                icon_key="slack",
            ),
            AccessSystem(
                name="Datadog APM & Logs",
                category="Observability",
                description="Infrastructure metrics, distributed traces, and log search.",
                icon_key="datadog",
            ),
            AccessSystem(
                name="Jira & Confluence",
                category="Project Management",
                description="Sprint tracking, engineering wikis, and technical design documents.",
                icon_key="jira",
            ),
            AccessSystem(
                name="HashiCorp Vault",
                category="Secrets Management",
                description="Dynamic database credentials and environment secrets.",
                icon_key="vault",
            ),
        ]
        db.add_all(default_systems)

    # 3. Seed Standard Checklist Templates
    if db.query(ChecklistTemplateItem).count() == 0:
        logger.info("Seeding standard checklist templates...")
        default_templates = [
            ChecklistTemplateItem(
                title="Hardware & 1Password Setup",
                description="Configure company MacBook with FileVault disk encryption and install 1Password master vault.",
                category="Hardware & Security",
                sort_order=1,
            ),
            ChecklistTemplateItem(
                title="Configure GPG & SSH Keys for GitHub",
                description="Generate ed25519 SSH keys, configure commit signing with GPG, and upload public keys to GitHub profile.",
                category="Security",
                sort_order=2,
            ),
            ChecklistTemplateItem(
                title="Install Docker Desktop & Local Dev Tooling",
                description="Install Docker, kubectl, Python 3.11+, Node 20+, and clone the primary monorepo.",
                category="Dev Environment",
                sort_order=3,
            ),
            ChecklistTemplateItem(
                title="Complete SOC2 Compliance & Security Training",
                description="Watch annual security awareness modules and sign data protection agreements.",
                category="Compliance",
                sort_order=4,
            ),
            ChecklistTemplateItem(
                title="Set Up AWS CLI & SSO Session",
                description="Run `aws configure sso` and verify access to staging sandbox accounts.",
                category="Cloud Infrastructure",
                team="Backend",
                sort_order=5,
            ),
            ChecklistTemplateItem(
                title="Configure Frontend Monorepo & Storybook",
                description="Install frontend packages, verify Vite dev server starts, and check Storybook components.",
                category="Dev Environment",
                team="Frontend",
                sort_order=6,
            ),
            ChecklistTemplateItem(
                title="Schedule 1-on-1 with Onboarding Buddy",
                description="Meet with assigned team buddy to review repo architecture and deployment cadence.",
                category="Team Knowledge",
                sort_order=7,
            ),
            ChecklistTemplateItem(
                title="Submit First PR to Staging",
                description="Create a test PR (good-first-issue or documentation tweak) to validate the CI/CD pipeline.",
                category="Milestones",
                sort_order=8,
            ),
        ]
        db.add_all(default_templates)

    # 4. Seed Demo Developers if none exist
    if db.query(Developer).count() == 0:
        logger.info("Seeding initial demo developers...")
        dev1 = Developer(
            full_name="Alex Rivera",
            email="alex.rivera@example.com",
            github_username="arivera-dev",
            team="Backend",
            role_title="Senior Platform Engineer",
            seniority="Senior",
            status="in_progress",
            notes="Focusing on event-driven payment microservices and PostgreSQL optimization.",
        )
        dev2 = Developer(
            full_name="Priya Patel",
            email="priya.patel@example.com",
            github_username="ppatel-cloud",
            team="DevOps",
            role_title="Staff Site Reliability Engineer",
            seniority="Staff",
            status="in_progress",
            notes="Leading Kubernetes cluster migration and Terraform module standardization.",
        )
        dev3 = Developer(
            full_name="Marcus Vance",
            email="marcus.vance@example.com",
            github_username="mvance-ui",
            team="Frontend",
            role_title="Lead Design System Engineer",
            seniority="Lead",
            status="completed",
            notes="Onboarded last month; maintains UI component library.",
        )
        db.add_all([dev1, dev2, dev3])
        db.commit()

        # Generate sample tasks and grants for dev1
        templates = db.query(ChecklistTemplateItem).all()
        for idx, tmpl in enumerate(templates):
            db.add(
                DeveloperChecklistStatus(
                    developer_id=dev1.id,
                    template_item_id=tmpl.id,
                    title=tmpl.title,
                    description=tmpl.description,
                    category=tmpl.category,
                    is_completed=(idx < 3),  # First 3 completed
                )
            )

        # Grants for dev1
        systems = db.query(AccessSystem).all()
        for s in systems[:3]:
            db.add(
                AccessGrant(
                    developer_id=dev1.id,
                    system_id=s.id,
                    status="active",
                    access_level="write",
                    notes="Approved during sprint planning",
                )
            )
        for s in systems[3:]:
            db.add(
                AccessGrant(
                    developer_id=dev1.id,
                    system_id=s.id,
                    status="pending",
                    access_level="read",
                    notes="Pending IT lead approval",
                )
            )

        # Repos for dev1
        db.add(
            RepoRequest(
                name="payments-service-v2",
                description="Next-generation async payment orchestration service",
                visibility="private",
                status="ready",
                github_url="https://github.com/seqa-enterprise/payments-service-v2",
                branch_protection_enabled=True,
                developer_id=dev1.id,
            )
        )

    db.commit()
    logger.info("Database seeding successfully verified.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and cleanup."""
    logger.info("Starting up SEQA Developer Onboarding & Provisioning Platform...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield
    
    logger.info("Shutting down SEQA Platform...")


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="""
# SEQA Developer Onboarding & Provisioning Platform API
Enterprise orchestration system automating developer lifecycle management:
- **Onboarding Checklists**: Template-driven task workflows with team-level scoping.
- **System Entitlements**: Cloud access provisioning (AWS, Slack, Datadog, Jira) with full audit trail.
- **Repository Automation**: Standardized GitHub repo creation, branch protection, and collaborator permissions.
- **SOC2 Compliance**: Immutable audit logging and RBAC (Admin, Manager, Viewer).
        """,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    api_prefix = settings.API_V1_PREFIX
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(developers_router, prefix=api_prefix)
    app.include_router(checklist_router, prefix=api_prefix)
    app.include_router(access_router, prefix=api_prefix)
    app.include_router(repos_router, prefix=api_prefix)
    app.include_router(dashboard_router, prefix=api_prefix)

    @app.get("/", tags=["Health"])
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "api_v1": api_prefix,
        }

    @app.get("/health", tags=["Health"])
    def healthcheck():
        return {"status": "healthy", "environment": settings.ENVIRONMENT}

    return app


app = create_application()
