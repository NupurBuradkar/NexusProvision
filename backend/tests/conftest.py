"""
Pytest Fixtures: In-memory SQLite Database, FastAPI TestClient, and RBAC Auth Tokens.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.developer import Developer
from app.models.system import AccessSystem
from app.models.checklist import ChecklistTemplateItem
from app.auth.security import get_password_hash, create_access_token

# Isolated SQLite in-memory database shared across single thread in tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db():
    """Yields a clean database session per test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db) -> User:
    user = User(
        email="admin@test.dev",
        hashed_password=get_password_hash("SecretAdmin123!"),
        full_name="Test Administrator",
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def manager_user(db) -> User:
    user = User(
        email="manager@test.dev",
        hashed_password=get_password_hash("SecretManager123!"),
        full_name="Test Manager",
        role="manager",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def viewer_user(db) -> User:
    user = User(
        email="viewer@test.dev",
        hashed_password=get_password_hash("SecretViewer123!"),
        full_name="Test Auditor",
        role="viewer",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_headers(admin_user) -> dict:
    token = create_access_token(data={"sub": admin_user.email, "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def manager_headers(manager_user) -> dict:
    token = create_access_token(data={"sub": manager_user.email, "role": manager_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def viewer_headers(viewer_user) -> dict:
    token = create_access_token(data={"sub": viewer_user.email, "role": viewer_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def sample_developer(db) -> Developer:
    dev = Developer(
        full_name="Devin Test",
        email="devin@test.dev",
        github_username="devin-test",
        team="Backend",
        role_title="Software Engineer",
        seniority="Mid-level",
        status="in_progress",
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


@pytest.fixture(scope="function")
def sample_system(db) -> AccessSystem:
    sys = AccessSystem(
        name="AWS Staging Cloud",
        category="Cloud",
        description="Staging cloud resources",
        icon_key="aws",
        is_active=True,
    )
    db.add(sys)
    db.commit()
    db.refresh(sys)
    return sys


@pytest.fixture(scope="function")
def sample_template(db) -> ChecklistTemplateItem:
    tmpl = ChecklistTemplateItem(
        title="Setup Dev Environment",
        description="Clone repo and run tests",
        category="Dev Environment",
        sort_order=1,
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl
