"""
Automated unit & integration tests for Access Systems and Entitlement Grants.
"""

from fastapi.testclient import TestClient


def test_list_systems(client: TestClient, admin_headers, sample_system):
    response = client.get("/api/v1/access/systems", headers=admin_headers)
    assert response.status_code == 200
    systems = response.json()
    assert any(s["name"] == sample_system.name for s in systems)


def test_create_system(client: TestClient, admin_headers):
    payload = {
        "name": "Datadog Observability",
        "category": "Monitoring",
        "description": "Log search and APM telemetry",
        "icon_key": "datadog",
    }
    response = client.post("/api/v1/access/systems", json=payload, headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Datadog Observability"


def test_create_access_grant(client: TestClient, manager_headers, sample_developer, sample_system):
    payload = {
        "developer_id": sample_developer.id,
        "system_id": sample_system.id,
        "access_level": "admin",
        "status": "active",
        "notes": "Team lead access grant",
    }
    response = client.post("/api/v1/access/grants", json=payload, headers=manager_headers)
    assert response.status_code == 201
    grant = response.json()
    assert grant["developer_id"] == sample_developer.id
    assert grant["status"] == "active"
    assert grant["access_level"] == "admin"


def test_update_access_grant_revoke(client: TestClient, manager_headers, sample_developer, sample_system):
    # Create grant first
    create_resp = client.post(
        "/api/v1/access/grants",
        json={
            "developer_id": sample_developer.id,
            "system_id": sample_system.id,
            "status": "active",
            "access_level": "read",
        },
        headers=manager_headers,
    )
    grant_id = create_resp.json()["id"]

    # Revoke grant
    revoke_resp = client.patch(
        f"/api/v1/access/grants/{grant_id}",
        json={"status": "revoked", "notes": "Departed team"},
        headers=manager_headers,
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["status"] == "revoked"
    assert revoke_resp.json()["revoked_at"] is not None
