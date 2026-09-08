"""
Automated unit & integration tests for Repository Provisioning.
"""

from fastapi.testclient import TestClient


def test_request_repository(client: TestClient, admin_headers, sample_developer):
    payload = {
        "name": "microservice-orders",
        "description": "Orders processing microservice",
        "visibility": "private",
        "branch_protection_enabled": True,
        "developer_id": sample_developer.id,
    }
    response = client.post("/api/v1/repos", json=payload, headers=admin_headers)
    assert response.status_code == 201
    repo = response.json()
    assert repo["name"] == "microservice-orders"
    assert repo["status"] == "pending"
    assert repo["developer_id"] == sample_developer.id


def test_request_repository_duplicate(client: TestClient, admin_headers, sample_developer):
    payload = {
        "name": "duplicate-repo",
        "developer_id": sample_developer.id,
    }
    resp1 = client.post("/api/v1/repos", json=payload, headers=admin_headers)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/repos", json=payload, headers=admin_headers)
    assert resp2.status_code == 409


def test_trigger_repository_provisioning(client: TestClient, manager_headers, sample_developer):
    # Request repo
    req_resp = client.post(
        "/api/v1/repos",
        json={"name": "analytics-pipeline", "developer_id": sample_developer.id},
        headers=manager_headers,
    )
    repo_id = req_resp.json()["id"]

    # Provision repo
    prov_resp = client.post(
        f"/api/v1/repos/{repo_id}/provision",
        json={"add_developer_as_collaborator": True, "permission": "admin"},
        headers=manager_headers,
    )
    assert prov_resp.status_code == 200
    data = prov_resp.json()
    assert data["status"] == "ready"
    assert data["github_url"] is not None
    assert "analytics-pipeline" in data["github_url"]
    assert data["provisioned_at"] is not None
