"""
Automated unit & integration tests for Developer Onboarding lifecycle endpoints.
"""

from fastapi.testclient import TestClient


def test_list_developers(client: TestClient, admin_headers, sample_developer):
    response = client.get("/api/v1/developers", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert any(d["email"] == sample_developer.email for d in data["items"])


def test_create_developer_with_onboarding(client: TestClient, manager_headers, sample_template, sample_system):
    payload = {
        "full_name": "Jordan Lee",
        "email": "jordan.lee@test.dev",
        "github_username": "jlee-code",
        "team": "Backend",
        "role_title": "Platform Engineer",
        "seniority": "Senior",
        "status": "in_progress",
        "auto_generate_checklist": True,
        "auto_grant_default_access": True,
    }
    response = client.post("/api/v1/developers", json=payload, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Jordan Lee"
    assert data["email"] == "jordan.lee@test.dev"
    assert len(data["checklist_tasks"]) >= 1
    assert len(data["access_grants"]) >= 1


def test_create_developer_duplicate_email(client: TestClient, manager_headers, sample_developer):
    payload = {
        "full_name": "Duplicate Dev",
        "email": sample_developer.email,
        "team": "Frontend",
        "role_title": "UI Engineer",
    }
    response = client.post("/api/v1/developers", json=payload, headers=manager_headers)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_get_developer_detail(client: TestClient, admin_headers, sample_developer):
    response = client.get(f"/api/v1/developers/{sample_developer.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["id"] == sample_developer.id


def test_update_developer(client: TestClient, manager_headers, sample_developer):
    payload = {"role_title": "Lead Software Engineer", "seniority": "Lead"}
    response = client.put(
        f"/api/v1/developers/{sample_developer.id}",
        json=payload,
        headers=manager_headers,
    )
    assert response.status_code == 200
    assert response.json()["role_title"] == "Lead Software Engineer"
    assert response.json()["seniority"] == "Lead"


def test_delete_developer_admin_only(client: TestClient, admin_headers, manager_headers, sample_developer):
    # Manager should be forbidden from deleting
    del_resp_mgr = client.delete(f"/api/v1/developers/{sample_developer.id}", headers=manager_headers)
    assert del_resp_mgr.status_code == 403

    # Admin should succeed
    del_resp_admin = client.delete(f"/api/v1/developers/{sample_developer.id}", headers=admin_headers)
    assert del_resp_admin.status_code == 204


def test_developer_progress_summary(client: TestClient, admin_headers, sample_developer):
    response = client.get(f"/api/v1/developers/{sample_developer.id}/progress", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["developer_id"] == sample_developer.id
    assert "overall_progress_percentage" in data
