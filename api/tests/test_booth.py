"""The booth profile (docs/product-model.md §6, M1): Try it only, rated exercises only, and no
visitor can read another's records."""

import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app import schemas
from app.config import Settings, environment_problems
from tests.test_sessions import session_body


@pytest.fixture
def booth(n1_settings: Settings) -> Iterator[Settings]:
    n1_settings.app_profile = "booth"
    n1_settings.booth_support_line = "Support line: 000"
    try:
        yield n1_settings
    finally:
        n1_settings.app_profile = "standard"
        n1_settings.booth_support_line = ""


@pytest.fixture
def rated(monkeypatch: pytest.MonkeyPatch) -> None:
    """A rating for the tests only; no exercise is rated safe yet."""
    monkeypatch.setattr(schemas, "SAFE_UNSUPERVISED_EXERCISES", ("goal_restatement",))


def test_no_exercise_is_rated_safe_yet_and_state_reset_is_excluded() -> None:
    assert schemas.SAFE_UNSUPERVISED_EXERCISES == ()
    assert schemas.EXCLUDED_FROM_BOOTH == ("state_reset+action_bridge",)


def test_health_reports_the_booth(client: TestClient, booth: Settings, rated: None) -> None:
    body = client.get("/api/health").json()
    assert body["profile"] == "booth"
    assert body["booth"] == {
        "support_line": "Support line: 000",
        "idle_seconds": 180,
        "exercises": ["goal_restatement"],
    }


def test_an_excluded_exercise_is_never_offered(
    client: TestClient, booth: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(schemas, "SAFE_UNSUPERVISED_EXERCISES", ("state_reset+action_bridge",))
    assert client.get("/api/health").json()["booth"]["exercises"] == []


def test_a_booth_needs_a_support_line(n1_settings: Settings) -> None:
    n1_settings.app_profile = "booth"
    try:
        assert any("BOOTH_SUPPORT_LINE" in p for p in environment_problems(n1_settings))
        n1_settings.booth_support_line = "Support line: 000"
        assert not any("BOOTH_SUPPORT_LINE" in p for p in environment_problems(n1_settings))
    finally:
        n1_settings.app_profile = "standard"
        n1_settings.booth_support_line = ""


def test_a_rated_exercise_runs_in_try_it(client: TestClient, booth: Settings, rated: None) -> None:
    body = session_body(mode="try", condition="goal_restatement")
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=body).status_code == 201


@pytest.mark.parametrize(
    "overrides",
    [
        {"mode": "try", "condition": "action_bridge"},  # not rated
        {"mode": "self_use", "condition": "goal_restatement"},  # the experiment
        {"mode": "usability", "condition": "goal_restatement"},
    ],
)
def test_anything_else_is_refused(
    client: TestClient, booth: Settings, rated: None, overrides: dict[str, Any]
) -> None:
    response = client.put(f"/api/sessions/{uuid.uuid4()}", json=session_body(**overrides))
    assert response.status_code == 403


@pytest.mark.parametrize(
    "method, path",
    [
        ("get", "/api/sessions"),
        ("patch", f"/api/sessions/{uuid.uuid4()}/follow-up"),
        ("get", "/api/n1/today"),
        ("post", "/api/n1/reveal"),
        ("post", "/api/n1/study-start"),
    ],
)
def test_no_records_and_no_experiment_in_the_booth(
    client: TestClient, booth: Settings, method: str, path: str
) -> None:
    response = getattr(client, method)(path, **({} if method == "get" else {"json": {}}))
    assert response.status_code == 403


def test_the_standard_profile_is_unchanged(client: TestClient) -> None:
    assert client.get("/api/sessions").status_code == 200
    assert client.get("/api/n1/today").status_code == 200
