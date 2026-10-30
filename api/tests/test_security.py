import uuid

from fastapi.testclient import TestClient

from app.config import Settings
from app.security import CLIENT_HEADER

BODY = {
    "mode": "dev",
    "condition": "goal_restatement",
    "status": "in_progress",
    "started_at": "2026-10-29T18:00:00+00:00",
}


def test_write_without_client_header_is_rejected(client: TestClient) -> None:
    response = client.put(f"/api/sessions/{uuid.uuid4()}", json=BODY, headers={CLIENT_HEADER: ""})
    assert response.status_code == 403


def test_write_from_foreign_origin_is_rejected(client: TestClient) -> None:
    response = client.put(
        f"/api/sessions/{uuid.uuid4()}", json=BODY, headers={"Origin": "https://example.com"}
    )
    assert response.status_code == 403


def test_write_from_allowed_origin_is_accepted(client: TestClient, settings: Settings) -> None:
    origin = settings.allowed_origin_list[0]
    response = client.put(f"/api/sessions/{uuid.uuid4()}", json=BODY, headers={"Origin": origin})
    assert response.status_code == 201


def test_write_with_form_content_type_is_rejected(client: TestClient) -> None:
    response = client.put(
        f"/api/sessions/{uuid.uuid4()}",
        content="mode=dev",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 415


def test_unknown_host_is_rejected(client: TestClient) -> None:
    response = client.get("/api/health", headers={"Host": "attacker.example"})
    assert response.status_code == 400


def test_no_cors_headers_are_granted(client: TestClient) -> None:
    response = client.options(
        "/api/sessions/x",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "x-client, content-type",
        },
    )
    assert "access-control-allow-origin" not in response.headers
