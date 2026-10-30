import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

import n_of_1
from make_schedule import write_schedule
from n_of_1 import (
    Slot,
    analyse,
    assemble,
    day_status_counts,
    load_export,
    load_schedule,
    randomization_test,
)

AB, GR = "action_bridge", "goal_restatement"
TZ = "+03:00"  # Europe/Istanbul


def at(day: int, hhmm: str) -> str:
    return f"2026-11-{day:02d}T{hhmm}:00{TZ}"


def build_export(
    days: list[dict[str, Any]],
    reveals: list[dict[str, Any]],
    sessions: list[dict[str, Any]],
    starts: dict[int, str],
) -> dict[str, Any]:
    return {
        "phase": 1,
        "timezone": "Europe/Istanbul",
        "late_start_minutes": 15,
        "days": days,
        "reveals": reveals,
        "sessions": sessions,
        "study_starts": [
            {"session_date": f"2026-11-{d:02d}", "recorded_at": t} for d, t in starts.items()
        ],
    }


def day(n: int, barrier: bool = False, late: bool | None = None) -> dict[str, Any]:
    return {
        "date": f"2026-11-{n:02d}",
        "planned_start": "19:00",
        "planned_at": at(n - 1, "21:00"),
        "barrier": barrier,
        "barrier_at": at(n, "12:00") if barrier else None,
        "barrier_late": late,
    }


def reveal(n: int, slot: int, condition: str, minutes: int = 0) -> dict[str, Any]:
    return {
        "id": f"r{n}",
        "slot": slot,
        "condition": condition,
        "session_date": f"2026-11-{n:02d}",
        "revealed_at": at(n, "19:00"),
        "minutes_after_planned": minutes,
    }


def session(
    n: int,
    condition: str,
    end: str = "19:10",
    status: str = "completed",
    ended: bool = True,
    saved: str | None = None,
) -> dict[str, Any]:
    return {
        "id": f"s{n}",
        "n1_reveal_id": f"r{n}",
        "condition": condition,
        "status": status,
        "started_at": at(n, "19:01"),
        "ended_at": at(n, end) if ended else None,
        "last_saved_at": at(n, saved or end),
    }


def from_dict(tmp_path: Path, data: dict[str, Any]) -> n_of_1.Export:
    path = tmp_path / "export.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return load_export(path)


SCHEDULE = [Slot(1, 1, AB), Slot(2, 1, GR), Slot(3, 2, GR), Slot(4, 2, AB)]


# ---------- assemble ----------


def test_outcome_uses_the_recorded_study_start_with_a_censored_latency(tmp_path: Path) -> None:
    data = build_export(
        days=[day(2), day(3), day(4)],
        reveals=[reveal(2, 1, AB), reveal(3, 2, GR), reveal(4, 3, GR)],
        sessions=[session(2, AB), session(3, GR), session(4, GR, status="aborted")],
        starts={2: at(2, "19:40"), 3: at(3, "21:30")},  # 30 min; 140 min
    )
    outcomes, notes = assemble(from_dict(tmp_path, data), SCHEDULE)
    assert [(o.slot, o.started, o.latency_min) for o in outcomes] == [
        (1, True, 30.0),
        (2, False, 120.0),
        (3, False, 120.0),
    ]
    assert [o.status for o in outcomes] == ["completed", "completed", "aborted"]
    assert outcomes[2].flags == []  # completion status is recorded, not a deviation
    assert notes == []


def test_a_start_after_midnight_counts_for_the_evening_session(tmp_path: Path) -> None:
    data = build_export(
        days=[day(2)],
        reveals=[reveal(2, 1, AB)],
        sessions=[session(2, AB, end="23:52")],
        starts={2: "2026-11-03T00:20:00+03:00"},
    )
    (outcome,), _ = assemble(from_dict(tmp_path, data), SCHEDULE)
    assert (outcome.started, outcome.latency_min) == (True, 28.0)


def test_late_starts_and_deviations_are_flagged(tmp_path: Path) -> None:
    data = build_export(
        days=[day(2), day(3)],
        reveals=[reveal(2, 1, AB, minutes=16), reveal(3, 2, GR, minutes=15)],
        sessions=[session(2, AB), session(3, AB)],
        starts={},
    )
    late, on_time = assemble(from_dict(tmp_path, data), SCHEDULE)[0]
    assert late.late_start and late.flags == ["late start: 16 min after the plan"]
    assert not on_time.late_start  # exactly 15 minutes is not late
    assert on_time.flags == [f"deviation: assigned {GR}, delivered {AB}"]


def test_an_unfinished_session_is_analysed_as_assigned_from_its_last_save(
    tmp_path: Path,
) -> None:
    data = build_export(
        days=[day(2), day(3)],
        reveals=[reveal(2, 1, AB), reveal(3, 2, GR)],
        sessions=[session(3, GR, ended=False, status="in_progress", saved="19:04")],
        starts={3: at(3, "19:34")},
    )
    not_begun, unfinished = assemble(from_dict(tmp_path, data), SCHEDULE)[0]
    assert (unfinished.slot, unfinished.assigned, unfinished.status) == (2, GR, "unfinished")
    assert (unfinished.started, unfinished.latency_min) == (True, 30.0)
    assert unfinished.window_from == at(3, "19:04")
    assert (not_begun.slot, not_begun.status, not_begun.session_id) == (1, "not_begun", None)


def test_a_revealed_slot_never_begun_is_analysed_as_assigned_from_the_reveal(
    tmp_path: Path,
) -> None:
    data = build_export(
        days=[day(2)], reveals=[reveal(2, 1, AB)], sessions=[], starts={2: at(2, "19:45")}
    )
    (outcome,), notes = assemble(from_dict(tmp_path, data), SCHEDULE)
    assert (outcome.assigned, outcome.delivered, outcome.status) == (AB, None, "not_begun")
    assert outcome.window_from == at(2, "19:00")  # the reveal time
    assert (outcome.started, outcome.latency_min, outcome.flags) == (True, 45.0, [])
    assert notes == []


def test_incomplete_sessions_stay_in_the_primary_analysis(tmp_path: Path) -> None:
    schedule = [Slot(i, (i + 1) // 2, AB if i % 2 else GR) for i in range(1, 5)]
    conditions = {i: AB if i % 2 else GR for i in range(1, 5)}
    data = build_export(
        days=[day(i) for i in range(1, 5)],
        reveals=[reveal(i, i, conditions[i]) for i in range(1, 5)],
        sessions=[
            session(1, AB, status="aborted"),
            session(2, GR),
            session(3, AB),
            session(4, GR, ended=False, status="in_progress", saved="19:05"),
            # Day 6 (Goal restatement) is revealed but never begun.
        ],
        starts={1: at(1, "19:20"), 3: at(3, "19:20")},
    )
    data["days"] += [day(5), day(6)]
    data["reveals"] += [reveal(5, 5, AB), reveal(6, 6, GR)]
    data["sessions"].append(session(5, AB))
    schedule += [Slot(5, 3, AB), Slot(6, 3, GR)]
    outcomes, _ = assemble(from_dict(tmp_path, data), schedule)
    summary = analyse(outcomes, 1)
    assert summary["complete_pairs"] == 3
    assert summary["completion_by_condition"] == {
        AB: {"completed": 2, "aborted": 1, "unfinished": 0, "not_begun": 0},
        GR: {"completed": 1, "aborted": 0, "unfinished": 1, "not_begun": 1},
    }
    assert summary["sensitivity_completed_sessions_only"]["complete_pairs"] == 0
    assert summary["sensitivity_excluding_flagged_days"]["complete_pairs"] == 3


def test_day_status_counts(tmp_path: Path) -> None:
    data = build_export(
        days=[
            day(2),  # session
            day(3, barrier=True, late=False),  # ineligible
            day(4, barrier=True, late=True),  # late barrier -> eligible, no session
            day(5),  # passed without a session
            day(6),  # slot revealed, never begun -> still a session day
        ],
        reveals=[reveal(2, 1, AB), reveal(6, 2, GR)],
        sessions=[session(2, AB)],
        starts={},
    )
    assert day_status_counts(from_dict(tmp_path, data)) == {
        "session": 2,
        "ineligible": 1,
        "eligible_no_session": 2,
    }


# ---------- randomisation test ----------


def test_exact_test_on_a_strong_effect_and_on_no_effect() -> None:
    stat, p = randomization_test([-60.0] * 10)
    assert stat == -60.0
    assert p == pytest.approx(2 / 1024)  # only the observed pattern and its mirror
    _, p_null = randomization_test([0.0] * 10)
    assert p_null == 1.0


def test_exact_p_value_on_a_small_hand_checked_example() -> None:
    # Differences 1, 2, 3: |mean| >= 2 only for all-plus and all-minus -> 2/8.
    _, p = randomization_test([1.0, 2.0, 3.0])
    assert p == pytest.approx(0.25)


def test_monte_carlo_is_used_above_the_exact_limit() -> None:
    _, p = randomization_test([-60.0] * 21, n_mc=2_000, seed=1)
    assert p < 0.01


def test_analyse_compares_complete_pairs_and_runs_the_sensitivity_analyses(
    tmp_path: Path,
) -> None:
    schedule = [Slot(i, (i + 1) // 2, AB if i % 2 else GR) for i in range(1, 21)]
    conditions = {i: AB if i % 2 else GR for i in range(1, 21)}
    data = build_export(
        days=[day(i) for i in range(1, 21)],
        # Day 1 (Action Bridge) starts 20 min late.
        reveals=[reveal(i, i, conditions[i], minutes=20 if i == 1 else 0) for i in range(1, 21)],
        sessions=[session(i, conditions[i]) for i in range(1, 21)],
        starts={i: at(i, "19:20") for i in range(1, 21, 2)},  # Action Bridge days only
    )
    export = from_dict(tmp_path, data)
    outcomes, _ = assemble(export, schedule)
    summary = analyse(outcomes, 1, day_status_counts(export))

    assert summary["complete_pairs"] == 10
    assert summary["mean_latency_min"] == {AB: 10.0, GR: 120.0}
    assert summary["proportion_started"] == {AB: 1.0, GR: 0.0}
    assert summary["latency_p_two_sided"] == pytest.approx(2 / 1024, abs=1e-5)
    assert summary["eligible_days_without_session"] == 0
    assert summary["study_start_recorded"] == {"yes": 10, "no": 10}
    assert summary["sensitivity_excluding_late_starts"]["complete_pairs"] == 9
    assert summary["sensitivity_excluding_flagged_days"]["complete_pairs"] == 9
    assert summary["warnings"] == []


def test_analyse_warns_below_the_minimum(tmp_path: Path) -> None:
    data = build_export([day(2)], [reveal(2, 1, AB)], [session(2, AB)], {})
    outcomes, _ = assemble(from_dict(tmp_path, data), SCHEDULE)
    summary = analyse(outcomes, 1)
    assert summary["complete_pairs"] == 0
    assert "protocol minimum" in summary["warnings"][0]


# ---------- files and CLI ----------


def test_load_schedule_refuses_a_modified_schedule(tmp_path: Path) -> None:
    csv_path, _ = write_schedule(1, 4, seed=5, out_dir=tmp_path)
    assert len(load_schedule(1, tmp_path)) == 4
    csv_path.write_text(csv_path.read_text().replace(AB, GR, 1), encoding="utf-8")
    with pytest.raises(ValueError, match="SHA-256"):
        load_schedule(1, tmp_path)


def test_end_to_end_cli(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    schedules = tmp_path / "schedules"
    write_schedule(1, 4, seed=11, out_dir=schedules)
    slots = load_schedule(1, schedules)
    data = build_export(
        days=[day(i + 2) for i in range(4)] + [day(9)],  # day 9: planned, no session
        reveals=[reveal(i + 2, s.slot, s.condition) for i, s in enumerate(slots)],
        sessions=[session(i + 2, s.condition) for i, s in enumerate(slots)],
        starts={2: at(2, "19:25")},
    )
    export_path = tmp_path / "phase1.json"
    export_path.write_text(json.dumps(data), encoding="utf-8")
    out = tmp_path / "days.csv"

    args = ["--phase", "1", "--export", str(export_path), "--schedules", str(schedules)]
    assert n_of_1.main([*args, "--out", str(out)]) == 0
    summary = json.loads(capsys.readouterr().out)
    assert summary["complete_pairs"] == 2
    assert summary["eligible_days_without_session"] == 1
    assert summary["warnings"] == ["only 4 session days; the protocol minimum is 20"]
    assert out.read_text(encoding="utf-8").count("\n") == 5

    assert n_of_1.main(["--phase", "2", "--export", str(export_path)]) == 1  # wrong phase


def test_phase_0_is_a_test_phase_in_the_generator() -> None:
    from make_schedule import PHASE_CONDITIONS

    assert PHASE_CONDITIONS[0] == PHASE_CONDITIONS[1]
    assert datetime.fromisoformat(at(2, "19:00")).utcoffset() == timedelta(hours=3)
