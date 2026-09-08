"""
Automated unit & integration tests for Checklist Templates and Task completion.
"""

from fastapi.testclient import TestClient
from app.models.checklist import DeveloperChecklistStatus


def test_list_templates(client: TestClient, admin_headers, sample_template):
    response = client.get("/api/v1/checklist/templates", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_create_template(client: TestClient, manager_headers):
    payload = {
        "title": "Configure AWS IAM MFA",
        "description": "Enforce hardware or app authenticator 2FA",
        "category": "Security",
        "is_required": True,
        "sort_order": 10,
    }
    response = client.post("/api/v1/checklist/templates", json=payload, headers=manager_headers)
    assert response.status_code == 201
    assert response.json()["title"] == "Configure AWS IAM MFA"


def test_toggle_developer_task(client: TestClient, admin_headers, db, sample_developer):
    task = DeveloperChecklistStatus(
        developer_id=sample_developer.id,
        title="Setup YubiKey",
        category="Security",
        is_completed=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Toggle to complete
    resp = client.patch(
        f"/api/v1/checklist/tasks/{task.id}/toggle",
        json={"is_completed": True, "notes": "Verified by Security team"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["is_completed"] is True
    assert resp.json()["completed_at"] is not None
    assert resp.json()["notes"] == "Verified by Security team"
