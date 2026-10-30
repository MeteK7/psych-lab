"""n-of-1 outcome assembly and randomisation test (plan §4.2, docs/protocol-n-of-1.md).

Input: one phase's records exported by the API (`app.manage export-n1`): planned days,
reveals, sessions linked to their reveal, and server-recorded study starts. The phase
schedule is checked against its SHA-256, and every reveal against the schedule.

Primary outcome per session day: the recorded study start, if within WINDOW_MINUTES
after the session ends (started yes/no; latency censored at the window). Every revealed
slot is analysed under its assigned condition, whatever its completion status; a session
that never finished is timed from its last saved step, one never begun from the reveal.

    uv run python n_of_1.py --phase 1 --export ../data/exports/phase1.json \
        --out ../data/exports/phase1-days.csv
"""

import argparse
import csv
import itertools
import json
import random
import sys
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any

from make_schedule import PHASE_CONDITIONS, SCHEDULE_DIR, sha256_of

WINDOW_MINUTES = 120
MIN_SESSION_DAYS = 20
MAX_EXACT_PAIRS = 20  # 2^20 sign patterns; beyond that, Monte Carlo


@dataclass(frozen=True)
class Slot:
    slot: int
    pair: int
    condition: str


@dataclass(frozen=True)
class Reveal:
    id: str
    slot: int
    condition: str
    session_date: date
    revealed_at: datetime
    minutes_after_planned: int


@dataclass(frozen=True)
class Session:
    id: str
    n1_reveal_id: str
    condition: str
    status: str
    started_at: datetime
    ended_at: datetime | None
    last_saved_at: datetime

    @property
    def window_from(self) -> datetime:
        """Session end; for a session that never finished, its last saved step."""
        return self.ended_at or self.last_saved_at


@dataclass(frozen=True)
class Day:
    date: date
    barrier: bool
    barrier_late: bool | None


@dataclass(frozen=True)
class Export:
    phase: int
    late_start_minutes: int
    days: list[Day]
    reveals: list[Reveal]
    sessions: list[Session]
    study_starts: dict[date, datetime]


@dataclass
class DayOutcome:
    slot: int
    pair: int
    day: str
    session_id: str | None
    assigned: str
    delivered: str | None
    status: str  # completed · aborted · unfinished · not_begun
    window_from: str
    study_start_at: str | None
    latency_min: float  # censored at the window
    started: bool
    late_start: bool
    flags: list[str] = field(default_factory=list)


# ---------- loading ----------


def _dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def load_export(path: Path) -> Export:
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return Export(
        phase=data["phase"],
        late_start_minutes=data["late_start_minutes"],
        days=[
            Day(date.fromisoformat(d["date"]), bool(d["barrier"]), d["barrier_late"])
            for d in data["days"]
        ],
        reveals=[
            Reveal(
                id=r["id"],
                slot=r["slot"],
                condition=r["condition"],
                session_date=date.fromisoformat(r["session_date"]),
                revealed_at=datetime.fromisoformat(r["revealed_at"]),
                minutes_after_planned=r["minutes_after_planned"],
            )
            for r in data["reveals"]
        ],
        sessions=[
            Session(
                id=s["id"],
                n1_reveal_id=s["n1_reveal_id"],
                condition=s["condition"],
                status=s["status"],
                started_at=datetime.fromisoformat(s["started_at"]),
                ended_at=_dt(s["ended_at"]),
                last_saved_at=datetime.fromisoformat(s["last_saved_at"]),
            )
            for s in data["sessions"]
        ],
        study_starts={
            date.fromisoformat(s["session_date"]): datetime.fromisoformat(s["recorded_at"])
            for s in data["study_starts"]
        },
    )


def load_schedule(phase: int, schedule_dir: Path = SCHEDULE_DIR) -> list[Slot]:
    """Loads the schedule after checking it against its recorded SHA-256."""
    csv_path = schedule_dir / f"schedule-phase{phase}.csv"
    recorded = (schedule_dir / f"schedule-phase{phase}.sha256").read_text().split()[0]
    if sha256_of(csv_path) != recorded:
        raise ValueError(
            f"{csv_path.name} does not match its recorded SHA-256; refusing to analyse."
        )
    with csv_path.open(encoding="utf-8", newline="") as f:
        return [Slot(int(r["slot"]), int(r["pair"]), r["condition"]) for r in csv.DictReader(f)]


# ---------- outcome ----------


def assemble(
    export: Export, schedule: Sequence[Slot], window_min: int = WINDOW_MINUTES
) -> tuple[list[DayOutcome], list[str]]:
    """One outcome per reveal, under the slot it revealed.

    Every revealed slot is kept (as randomised), whether its session was completed,
    aborted, unfinished or never begun; the completion status is recorded per day, not
    treated as a deviation.
    """
    notes: list[str] = []
    slots = {s.slot: s for s in schedule}
    sessions = {s.n1_reveal_id: s for s in export.sessions}

    outcomes: list[DayOutcome] = []
    for reveal in sorted(export.reveals, key=lambda r: r.revealed_at):
        day = reveal.session_date.isoformat()
        slot = slots.get(reveal.slot)
        if slot is None:
            notes.append(f"{day}: revealed slot {reveal.slot} is not in the schedule; excluded")
            continue
        session = sessions.get(reveal.id)
        window_from = session.window_from if session else reveal.revealed_at

        started_at = export.study_starts.get(reveal.session_date)
        latency, started = float(window_min), False
        flags: list[str] = []
        if started_at is not None:
            minutes = (started_at - window_from).total_seconds() / 60
            if minutes < 0:
                flags.append("study start recorded before the outcome window opened")
            else:
                started = minutes <= window_min
                latency = round(min(minutes, window_min), 2)

        late = reveal.minutes_after_planned > export.late_start_minutes
        if late:
            flags.append(f"late start: {reveal.minutes_after_planned} min after the plan")
        if reveal.condition != slot.condition:
            flags.append(f"reveal condition {reveal.condition} differs from the schedule")
        if session is not None and session.condition != slot.condition:
            flags.append(f"deviation: assigned {slot.condition}, delivered {session.condition}")
        outcomes.append(
            DayOutcome(
                slot=slot.slot,
                pair=slot.pair,
                day=day,
                session_id=session.id if session else None,
                assigned=slot.condition,
                delivered=session.condition if session else None,
                status=completion(session),
                window_from=window_from.isoformat(),
                study_start_at=started_at.isoformat() if started_at else None,
                latency_min=latency,
                started=started,
                late_start=late,
                flags=flags,
            )
        )
    return outcomes, notes


def completion(session: Session | None) -> str:
    if session is None:
        return "not_begun"
    return "unfinished" if session.ended_at is None else session.status


def completion_by_condition(outcomes: Sequence[DayOutcome], phase: int) -> dict[str, Any]:
    """Completion status counts per assigned condition (protocol §6, §7)."""
    return {
        c: {
            status: sum(o.assigned == c and o.status == status for o in outcomes)
            for status in ("completed", "aborted", "unfinished", "not_begun")
        }
        for c in PHASE_CONDITIONS[phase]
    }


def day_status_counts(export: Export) -> dict[str, int]:
    """Status of every planned day once the phase is over (protocol §3).

    session: a slot was revealed (begun or not). ineligible: a barrier reported before
    the planned start. eligible_no_session: everything else, including late barriers.
    """
    revealed = {r.session_date for r in export.reveals}
    counts = {"session": 0, "ineligible": 0, "eligible_no_session": 0}
    for day in export.days:
        if day.date in revealed:
            counts["session"] += 1
        elif day.barrier and not day.barrier_late:
            counts["ineligible"] += 1
        else:
            counts["eligible_no_session"] += 1
    return counts


# ---------- randomisation test ----------


def randomization_test(
    differences: Sequence[float], n_mc: int = 100_000, seed: int = 0
) -> tuple[float, float]:
    """Two-sided within-pair randomisation test of the mean pair difference.

    Under the null, each pair's two labels are exchangeable, so each difference's sign
    is equally likely. Exact enumeration up to MAX_EXACT_PAIRS pairs, Monte Carlo above.
    """
    if not differences:
        raise ValueError("no complete pairs")
    k = len(differences)
    observed = sum(differences) / k
    tolerance = 1e-9

    def extreme(signs: Sequence[int]) -> bool:
        stat = sum(s * d for s, d in zip(signs, differences, strict=True)) / k
        return abs(stat) >= abs(observed) - tolerance

    if k <= MAX_EXACT_PAIRS:
        patterns = itertools.product((1, -1), repeat=k)
        hits = sum(extreme(p) for p in patterns)
        return observed, hits / 2**k
    rng = random.Random(seed)
    hits = sum(extreme([rng.choice((1, -1)) for _ in range(k)]) for _ in range(n_mc))
    return observed, (hits + 1) / (n_mc + 1)


def compare(outcomes: Sequence[DayOutcome], phase: int) -> dict[str, object]:
    """As randomised: assigned condition, complete pairs only."""
    a, b = PHASE_CONDITIONS[phase]
    by_pair: dict[int, dict[str, DayOutcome]] = {}
    for o in outcomes:
        by_pair.setdefault(o.pair, {})[o.assigned] = o
    complete = [p for p in by_pair.values() if a in p and b in p]
    result: dict[str, object] = {"complete_pairs": len(complete)}
    if not complete:
        return result

    def mean(values: list[float]) -> float:
        return round(sum(values) / len(values), 3)

    diff_latency, p_latency = randomization_test(
        [p[a].latency_min - p[b].latency_min for p in complete]
    )
    diff_started, p_started = randomization_test(
        [float(p[a].started) - float(p[b].started) for p in complete]
    )
    result.update(
        {
            "mean_latency_min": {
                a: mean([p[a].latency_min for p in complete]),
                b: mean([p[b].latency_min for p in complete]),
            },
            "proportion_started": {
                a: mean([float(p[a].started) for p in complete]),
                b: mean([float(p[b].started) for p in complete]),
            },
            "latency_difference_a_minus_b": round(diff_latency, 3),
            "latency_p_two_sided": round(p_latency, 5),
            "started_difference_a_minus_b": round(diff_started, 3),
            "started_p_two_sided": round(p_started, 5),
        }
    )
    return result


def analyse(
    outcomes: Sequence[DayOutcome], phase: int, day_counts: Mapping[str, int] | None = None
) -> dict[str, object]:
    a, b = PHASE_CONDITIONS[phase]
    warnings = []
    if len(outcomes) < MIN_SESSION_DAYS:
        warnings.append(
            f"only {len(outcomes)} session days; the protocol minimum is {MIN_SESSION_DAYS}"
        )
    summary: dict[str, object] = {
        "phase": phase,
        "condition_a": a,
        "condition_b": b,
        "session_days": len(outcomes),
        "eligible_days_without_session": (
            day_counts.get("eligible_no_session", 0) if day_counts is not None else None
        ),
        "day_status": dict(day_counts) if day_counts is not None else None,
        "study_start_recorded": dict(
            Counter("yes" if o.study_start_at else "no" for o in outcomes)
        ),
        "completion_by_condition": completion_by_condition(outcomes, phase),
        "deviations": [f"slot {o.slot}: {f}" for o in outcomes for f in o.flags],
        "warnings": warnings,
        # Primary: every begun session, as assigned (protocol §7).
        **compare(outcomes, phase),
        # Prespecified sensitivity analyses (protocol §7); never the primary result.
        "sensitivity_excluding_late_starts": compare(
            [o for o in outcomes if not o.late_start], phase
        ),
        "sensitivity_excluding_flagged_days": compare([o for o in outcomes if not o.flags], phase),
        "sensitivity_completed_sessions_only": compare(
            [o for o in outcomes if o.status == "completed"], phase
        ),
    }
    return summary


# ---------- CLI ----------


def write_days(path: Path, outcomes: Sequence[DayOutcome]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = [{**asdict(o), "flags": "; ".join(o.flags)} for o in outcomes]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ["slot"])
        writer.writeheader()
        writer.writerows(rows)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="n-of-1 outcomes and randomisation test")
    parser.add_argument("--phase", type=int, choices=sorted(PHASE_CONDITIONS), required=True)
    parser.add_argument("--export", type=Path, required=True, help="JSON from export-n1")
    parser.add_argument("--schedules", type=Path, default=SCHEDULE_DIR)
    parser.add_argument("--out", type=Path, help="write the per-day table here (CSV)")
    args = parser.parse_args(argv)

    export = load_export(args.export)
    if export.phase != args.phase:
        print(f"Export is for phase {export.phase}, not {args.phase}.", file=sys.stderr)
        return 1
    outcomes, notes = assemble(export, load_schedule(args.phase, args.schedules))
    if args.out:
        write_days(args.out, outcomes)
    summary = analyse(outcomes, args.phase, day_status_counts(export))
    summary["notes"] = notes
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
