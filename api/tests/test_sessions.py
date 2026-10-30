import uuid
from typing import Any

from fastapi.testclient import TestClient


def session_body(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "mode": "self_use",
        "condition": "action_bridge",
        "status": "in_progress",
        "content_versions": {"action-bridge": "1"},
        "steps": [],
        "started_at": "2026-10-29T18:00:00+00:00",
    }
    body.update(overrides)
    return body


def completed_body(**overrides: Any) -> dict[str, Any]:
    defaults: dict[str, Any] = {
        "status": "completed",
        "ended_at": "2026-10-29T18:05:00+00:00",
        "steps": [
            {
                "step": "plan",
                "content_id": "action-bridge",
                "content_version": "1",
                "started_at": "2026-10-29T18:00:00+00:00",
                "ended_at": "2026-10-29T18:05:00+00:00",
                "result": {"completed": True},
            }
        ],
    }
    return session_body(**{**defaults, **overrides})


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_put_creates_then_lists(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    created = client.put(f"/api/sessions/{session_id}", json=session_body())
    assert created.status_code == 201
    assert created.json()["id"] == session_id

    listed = client.get("/api/sessions")
    assert listed.status_code == 200
    assert [s["id"] for s in listed.json()] == [session_id]


def test_put_is_idempotent(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    first = client.put(f"/api/sessions/{session_id}", json=session_body())
    second = client.put(f"/api/sessions/{session_id}", json=session_body())
    assert (first.status_code, second.status_code) == (201, 200)
    assert len(client.get("/api/sessions").json()) == 1


def test_in_progress_session_can_be_updated(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    client.put(f"/api/sessions/{session_id}", json=session_body())
    response = client.put(f"/api/sessions/{session_id}", json=completed_body())
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["steps"][0]["step"] == "plan"


def test_finished_session_accepts_identical_retry_only(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    assert client.put(f"/api/sessions/{session_id}", json=completed_body()).status_code == 201
    assert client.put(f"/api/sessions/{session_id}", json=completed_body()).status_code == 200
    changed = completed_body(ratings={"unpleasant_after": 3})
    assert client.put(f"/api/sessions/{session_id}", json=changed).status_code == 409


def test_list_filters_by_mode(client: TestClient) -> None:
    client.put(f"/api/sessions/{uuid.uuid4()}", json=session_body(mode="self_use"))
    client.put(f"/api/sessions/{uuid.uuid4()}", json=session_body(mode="dev"))
    modes = [s["mode"] for s in client.get("/api/sessions", params={"mode": "dev"}).json()]
    assert modes == ["dev"]


def test_rejects_unknown_condition(client: TestClient) -> None:
    response = client.put(
        f"/api/sessions/{uuid.uuid4()}", json=session_body(condition="something_else")
    )
    assert response.status_code == 422


def test_rejects_end_before_start(client: TestClient) -> None:
    body = completed_body(ended_at="2026-10-29T17:00:00+00:00")
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=body).status_code == 422


def test_rejects_finished_session_without_end(client: TestClient) -> None:
    body = session_body(status="completed")
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=body).status_code == 422


def test_rejects_naive_timestamps(client: TestClient) -> None:
    body = session_body(started_at="2026-10-29T18:00:00")
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=body).status_code == 422


def test_follow_up_is_recorded(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    client.put(f"/api/sessions/{session_id}", json=completed_body())
    response = client.patch(
        f"/api/sessions/{session_id}/follow-up",
        json={"self_reported_minutes": 45, "burden": 2},
    )
    assert response.status_code == 200
    followup = response.json()["followup"]
    assert followup["self_reported_minutes"] == 45
    assert "recorded_at" in followup


def test_follow_up_for_missing_session_is_404(client: TestClient) -> None:
    response = client.patch(f"/api/sessions/{uuid.uuid4()}/follow-up", json={"burden": 1})
    assert response.status_code == 404


def test_follow_up_validates_ranges(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    client.put(f"/api/sessions/{session_id}", json=completed_body())
    response = client.patch(f"/api/sessions/{session_id}/follow-up", json={"burden": 11})
    assert response.status_code == 422
