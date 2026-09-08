"""
Automated unit & integration tests for Authentication & Authorization endpoints.
"""

from fastapi.testclient import TestClient


def test_login_success(client: TestClient, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.dev", "password": "SecretAdmin123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.dev"
    assert data["user"]["role"] == "admin"


def test_login_wrong_password(client: TestClient, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.dev", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_unknown_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@test.dev", "password": "password"},
    )
    assert response.status_code == 401


def test_get_current_user_profile(client: TestClient, admin_headers):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.dev"


def test_get_current_user_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_refresh_token(client: TestClient, admin_headers):
    response = client.post("/api/v1/auth/refresh", headers=admin_headers)
    assert response.status_code == 200
    assert "access_token" in response.json()
