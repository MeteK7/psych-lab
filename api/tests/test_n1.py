import uuid
from datetime import date, datetime, time
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Connection
from sqlalchemy.orm import Session

from app import n1
from app.config import Settings
from app.models import N1Day, N1Reveal, SessionRecord
from tests.conftest import Clock, write_schedule

# Europe/Istanbul is UTC+03:00 all year; times below are written in local time.


def at(clock: Clock, local_iso: str) -> None:
    clock.set(local_iso + "+03:00")


def plan(client: TestClient, clock: Clock, day: str, start: str, planned_on: str) -> Any:
    at(clock, planned_on)
    response = client.put(f"/api/n1/days/{day}", json={"planned_start": start})
    assert response.status_code == 200, response.text
    return response.json()


def run_session(
    client: TestClient,
    reveal: dict[str, Any],
    start: str,
    end: str | None,
    mode: str = "self_use",
    status: str = "completed",
) -> str:
    session_id = str(uuid.uuid4())
    body = {
        "mode": mode,
        "condition": reveal["condition"],
        "status": status,
        "started_at": start + "+03:00",
        "ended_at": end + "+03:00" if end else None,
        "n1_reveal_id": reveal["id"],
    }
    response = client.put(f"/api/sessions/{session_id}", json=body)
    assert response.status_code == 201, response.text
    return session_id


# ---------- planning ----------


def test_plans_are_made_for_future_days_only(client: TestClient, clock: Clock) -> None:
    view = plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    assert view["tomorrow"] == "2026-11-02"
    assert view["tomorrow_plan"] == {"planned_start": "19:00"}

    at(clock, "2026-11-02T08:00")
    assert client.put("/api/n1/days/2026-11-02", json={"planned_start": "20:00"}).status_code == 409
    assert client.put("/api/n1/days/2026-11-01", json={"planned_start": "20:00"}).status_code == 409


# ---------- reveal ----------


def test_reveal_needs_a_plan_from_the_day_before(client: TestClient, clock: Clock) -> None:
    at(clock, "2026-11-02T19:00")
    assert client.post("/api/n1/reveal", json={}).status_code == 409
    assert client.get("/api/n1/today").json()["status"] == "no_plan"


def test_reveals_slots_in_order_and_only_once_per_day(client: TestClient, clock: Clock) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:05")
    first = client.post("/api/n1/reveal", json={}).json()
    assert first["status"] == "revealed"
    assert first["reveal"]["condition"] == "goal_restatement"  # slot 1
    assert first["reveal"]["minutes_after_planned"] == 5
    assert first["reveal"]["late_start"] is False

    # Asking again the same day returns the same reveal; no second slot is used.
    again = client.post("/api/n1/reveal", json={}).json()
    assert again["reveal"]["id"] == first["reveal"]["id"]

    assert again["progress"] == {"session_days": 1, "planned_days": 1}

    plan(client, clock, "2026-11-03", "19:00", "2026-11-02T22:00")
    at(clock, "2026-11-03T19:00")
    second = client.post("/api/n1/reveal", json={}).json()
    assert second["reveal"]["condition"] == "action_bridge"  # slot 2
    assert second["progress"] == {"session_days": 2, "planned_days": 2}


def test_a_start_more_than_15_minutes_late_is_flagged(client: TestClient, clock: Clock) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:16")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    assert (reveal["minutes_after_planned"], reveal["late_start"]) == (16, True)


def test_reveal_refuses_a_schedule_whose_hash_changed(
    client: TestClient, clock: Clock, n1_settings: Settings
) -> None:
    csv_path = Path(n1_settings.n1_schedule_dir) / "schedule-phase1.csv"
    csv_path.write_text(csv_path.read_text() + "5,3,action_bridge\n")
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    response = client.post("/api/n1/reveal", json={})
    assert response.status_code == 409
    assert "hash" in response.json()["detail"]


def test_reveal_uses_the_local_date_not_utc(client: TestClient, clock: Clock) -> None:
    # 01:30 local on 3 Nov is still 2 Nov in UTC.
    plan(client, clock, "2026-11-03", "01:15", "2026-11-02T20:00")
    at(clock, "2026-11-03T01:30")
    view = client.post("/api/n1/reveal", json={}).json()
    assert view["today"] == "2026-11-03"
    assert view["reveal"]["minutes_after_planned"] == 15
    assert view["reveal"]["late_start"] is False  # exactly 15 is not late


# ---------- barrier ----------


def test_barrier_before_the_planned_start_makes_the_day_ineligible(
    client: TestClient, clock: Clock
) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T12:00")
    assert client.get("/api/n1/today").json()["barrier_would_be_late"] is False
    view = client.post("/api/n1/barrier", json={"reason": "ill"}).json()
    assert view["status"] == "ineligible"
    assert view["plan"]["barrier_late"] is False
    assert view["can_start_session"] is False
    assert client.post("/api/n1/reveal", json={}).status_code == 409


def test_barrier_after_the_planned_start_is_flagged_late(client: TestClient, clock: Clock) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:30")
    assert client.get("/api/n1/today").json()["barrier_would_be_late"] is True
    view = client.post("/api/n1/barrier", json={"reason": "visitors"}).json()
    assert view["status"] == "late_barrier"
    assert view["plan"]["barrier_late"] is True
    assert view["can_start_session"] is False


def test_no_barrier_once_the_session_has_started(client: TestClient, clock: Clock) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    client.post("/api/n1/reveal", json={})
    assert client.post("/api/n1/barrier", json={"reason": "tired"}).status_code == 409


# ---------- sessions linked to reveals ----------


def test_a_session_must_match_its_reveal(client: TestClient, clock: Clock) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    base = {
        "status": "in_progress",
        "started_at": "2026-11-02T19:01:00+03:00",
        "n1_reveal_id": reveal["id"],
    }

    wrong_condition = {**base, "mode": "self_use", "condition": "action_bridge"}
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=wrong_condition).status_code == 409
    wrong_mode = {**base, "mode": "dev", "condition": reveal["condition"]}
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=wrong_mode).status_code == 409

    ok = {**base, "mode": "self_use", "condition": reveal["condition"]}
    first = str(uuid.uuid4())
    assert client.put(f"/api/sessions/{first}", json=ok).status_code == 201
    assert client.put(f"/api/sessions/{first}", json=ok).status_code == 200  # same session
    assert client.put(f"/api/sessions/{uuid.uuid4()}", json=ok).status_code == 409  # second one
    assert client.get("/api/n1/today").json()["status"] == "session"


# ---------- study start ----------


def test_study_start_is_recorded_once_with_server_time_and_a_note(
    client: TestClient, clock: Clock, n1_settings: Settings
) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    assert client.post("/api/n1/study-start", json={"text": "too early"}).status_code == 409
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]

    run_session(client, reveal, "2026-11-02T19:01", "2026-11-02T19:06")
    view = client.get("/api/n1/today").json()
    assert view["study_start_target"]["session_date"] == "2026-11-02"

    at(clock, "2026-11-02T19:20")
    view = client.post("/api/n1/study-start", json={"text": "worked example 1"}).json()
    recorded = datetime.fromisoformat(view["study_start"]["recorded_at"].replace("Z", "+00:00"))
    assert recorded == datetime.fromisoformat("2026-11-02T16:20:00+00:00")  # 19:20 local
    assert view["study_start_target"] is None
    note = Path(n1_settings.n1_study_log_dir) / "2026-11-02.md"
    assert note.read_text(encoding="utf-8") == "19:20 worked example 1\n"

    assert client.post("/api/n1/study-start", json={"text": "again"}).status_code == 409


def test_a_study_start_after_midnight_belongs_to_the_evening_session(
    client: TestClient, clock: Clock, n1_settings: Settings
) -> None:
    plan(client, clock, "2026-11-02", "23:30", "2026-11-01T21:00")
    at(clock, "2026-11-02T23:40")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    run_session(client, reveal, "2026-11-02T23:41", "2026-11-02T23:52")

    at(clock, "2026-11-03T00:20")  # next calendar day, 28 min after the session ended
    view = client.get("/api/n1/today").json()
    assert view["today"] == "2026-11-03"
    assert view["study_start_target"]["session_date"] == "2026-11-02"
    client.post("/api/n1/study-start", json={"text": "late start"})
    note = Path(n1_settings.n1_study_log_dir) / "2026-11-02.md"
    assert note.read_text(encoding="utf-8") == "00:20 late start\n"
    assert not (Path(n1_settings.n1_study_log_dir) / "2026-11-03.md").exists()


@pytest.mark.parametrize("status, end", [("aborted", "2026-11-02T19:03"), ("in_progress", None)])
def test_a_study_start_can_follow_an_incomplete_session(
    client: TestClient, clock: Clock, status: str, end: str | None
) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    at(clock, "2026-11-02T19:04")  # last save, by server time
    run_session(client, reveal, "2026-11-02T19:01", end, status=status)

    view = client.get("/api/n1/today").json()
    window_from = view["study_start_target"]["window_from"].replace("Z", "+00:00")
    expected = (end or "2026-11-02T19:04") + "+03:00"
    assert datetime.fromisoformat(window_from) == datetime.fromisoformat(expected)
    at(clock, "2026-11-02T19:30")
    assert client.post("/api/n1/study-start", json={"text": "x"}).status_code == 200


def test_a_study_start_can_follow_a_reveal_whose_session_was_never_begun(
    client: TestClient, clock: Clock
) -> None:
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    client.post("/api/n1/reveal", json={})
    view = client.get("/api/n1/today").json()
    window_from = view["study_start_target"]["window_from"].replace("Z", "+00:00")
    assert datetime.fromisoformat(window_from) == datetime.fromisoformat("2026-11-02T19:00+03:00")

    at(clock, "2026-11-02T19:30")
    view = client.post("/api/n1/study-start", json={"text": "x"}).json()
    assert view["can_start_session"] is False  # the outcome is fixed now


def test_the_note_file_is_only_appended_to(
    client: TestClient, clock: Clock, n1_settings: Settings
) -> None:
    folder = Path(n1_settings.n1_study_log_dir)
    folder.mkdir(parents=True)
    (folder / "2026-11-02.md").write_text("earlier line\n", encoding="utf-8")
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    run_session(client, reveal, "2026-11-02T19:01", "2026-11-02T19:06")
    at(clock, "2026-11-02T19:10")
    client.post("/api/n1/study-start", json={"text": "start"})
    assert (folder / "2026-11-02.md").read_text() == "earlier line\n19:10 start\n"


# ---------- day status and phase 0 ----------


def test_day_status_rules() -> None:
    day = N1Day(
        phase=1, date=date(2026, 11, 2), planned_start=time(19), planned_at=datetime(2026, 11, 1)
    )
    on, before, after = date(2026, 11, 2), date(2026, 11, 2), date(2026, 11, 3)
    assert n1.day_status(None, None, None, on, before) == "no_plan"
    assert n1.day_status(day, None, None, on, before) == "pending"
    assert n1.day_status(day, None, None, on, after) == "eligible_no_session"  # day passed

    reveal = N1Reveal(phase=1, slot=1, condition="action_bridge", session_date=on)
    assert n1.day_status(day, reveal, None, on, before) == "revealed"
    assert n1.day_status(day, reveal, None, on, after) == "session"  # never begun
    assert n1.day_status(day, reveal, SessionRecord(), on, after) == "session"

    day.barrier, day.barrier_late = "ill", False
    assert n1.day_status(day, None, None, on, after) == "ineligible"
    day.barrier_late = True
    assert n1.day_status(day, None, None, on, before) == "late_barrier"
    assert n1.day_status(day, None, None, on, after) == "eligible_no_session"


@pytest.mark.parametrize("phase, mode", [(0, "dev"), (1, "self_use")])
def test_phase_0_is_a_test_phase_with_dev_sessions(
    client: TestClient, clock: Clock, n1_settings: Settings, phase: int, mode: str
) -> None:
    n1_settings.n1_phase = phase
    view = client.get("/api/n1/today").json()
    assert (view["phase"], view["test_phase"], view["session_mode"]) == (phase, phase == 0, mode)


def test_export_contains_one_phase_without_free_text(
    client: TestClient, clock: Clock, n1_settings: Settings, connection: Connection, tmp_path: Path
) -> None:
    write_schedule(tmp_path / "unused", 2, [])
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    session_id = run_session(client, reveal, "2026-11-02T19:01", "2026-11-02T19:06")
    at(clock, "2026-11-02T19:10")
    client.post("/api/n1/study-start", json={"text": "private words"})

    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        data = n1.export(db, 1, n1_settings)
        assert n1.export(db, 0, n1_settings)["reveals"] == []

    assert data["late_start_minutes"] == 15
    assert [r["slot"] for r in data["reveals"]] == [1]
    assert data["sessions"][0]["id"] == session_id
    saved = datetime.fromisoformat(data["sessions"][0]["last_saved_at"])
    assert saved == datetime.fromisoformat("2026-11-02T19:00:00+03:00")  # server time of the save
    assert data["study_starts"][0]["session_date"] == "2026-11-02"
    assert "private words" not in str(data)


def test_export_lists_try_it_runs_on_session_days_without_their_answers(
    client: TestClient, clock: Clock, n1_settings: Settings, connection: Connection
) -> None:
    def try_it(start: str, condition: str = "action_bridge") -> str:
        session_id = str(uuid.uuid4())
        body = {
            "mode": "try",
            "condition": condition,
            "status": "completed",
            "started_at": start + "+03:00",
            "ended_at": start + "+03:00",
        }
        assert client.put(f"/api/sessions/{session_id}", json=body).status_code == 201
        return session_id

    before = try_it("2026-11-01T23:59")  # the evening before the first session day
    plan(client, clock, "2026-11-02", "19:00", "2026-11-01T21:00")
    at(clock, "2026-11-02T19:00")
    reveal = client.post("/api/n1/reveal", json={}).json()["reveal"]
    run_session(client, reveal, "2026-11-02T19:01", "2026-11-02T19:06")
    morning = try_it("2026-11-02T00:00")
    after_midnight = try_it("2026-11-03T00:30", "goal_restatement")
    too_late = try_it("2026-11-04T00:00")

    with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
        data = n1.export(db, 1, n1_settings)

    assert data["reveals"][0]["day_start"] == "2026-11-02T00:00:00+03:00"
    others = data["other_sessions"]
    assert [o["id"] for o in others] == [morning, after_midnight]
    assert {before, too_late}.isdisjoint(o["id"] for o in others)
    # A Try it run keeps no answers (M1), but its row still gives the exposure analysis all it
    # reads: the same six fields as before M1.
    assert others == [
        {
            "id": morning,
            "mode": "try",
            "condition": "action_bridge",
            "status": "completed",
            "started_at": "2026-11-02T00:00:00+03:00",
            "ended_at": "2026-11-02T00:00:00+03:00",
        },
        {
            "id": after_midnight,
            "mode": "try",
            "condition": "goal_restatement",
            "status": "completed",
            "started_at": "2026-11-03T00:30:00+03:00",
            "ended_at": "2026-11-03T00:30:00+03:00",
        },
    ]
