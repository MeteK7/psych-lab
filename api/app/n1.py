"""n-of-1 daily records (protocol-n-of-1.md §4–§6).

All dates are local dates in settings.study_timezone. The schedule is read from its
CSV after checking the recorded SHA-256, and only the revealed slot ever leaves here.
"""

import csv
import hashlib
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import N1Day, N1Reveal, N1StudyStart, SessionRecord

LATE_START_MINUTES = 15
STUDY_START_WINDOW = timedelta(hours=24)  # how long after a session its start can be logged


class N1Error(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


@dataclass(frozen=True)
class Slot:
    slot: int
    pair: int
    condition: str


# ---------- time ----------


def zone(settings: Settings) -> ZoneInfo:
    return ZoneInfo(settings.study_timezone)


def local_today(now: datetime, settings: Settings) -> date:
    return now.astimezone(zone(settings)).date()


def planned_start_at(day: N1Day, settings: Settings) -> datetime:
    return datetime.combine(day.date, day.planned_start, tzinfo=zone(settings))


def session_mode(phase: int) -> str:
    # Phase 0 is a test phase: its sessions are development data, never self_use.
    return "dev" if phase == 0 else "self_use"


# ---------- schedule ----------


def load_schedule(settings: Settings, phase: int) -> list[Slot]:
    csv_path = Path(settings.n1_schedule_dir) / f"schedule-phase{phase}.csv"
    sha_path = csv_path.with_suffix(".sha256")
    if not csv_path.exists() or not sha_path.exists():
        raise N1Error(409, f"The experiment schedule is missing (part {phase}). See the runbook.")
    recorded = sha_path.read_text(encoding="utf-8").split()[0]
    if hashlib.sha256(csv_path.read_bytes()).hexdigest() != recorded:
        raise N1Error(409, "The experiment schedule was changed (hash mismatch) and can't be used.")
    with csv_path.open(encoding="utf-8", newline="") as f:
        return [Slot(int(r["slot"]), int(r["pair"]), r["condition"]) for r in csv.DictReader(f)]


# ---------- queries ----------


def _day(db: Session, phase: int, on: date) -> N1Day | None:
    return db.get(N1Day, (phase, on))


def _reveal_on(db: Session, phase: int, on: date) -> N1Reveal | None:
    return db.scalar(select(N1Reveal).where(N1Reveal.phase == phase, N1Reveal.session_date == on))


def _session_for(db: Session, reveal: N1Reveal | None) -> SessionRecord | None:
    if reveal is None:
        return None
    return db.scalar(select(SessionRecord).where(SessionRecord.n1_reveal_id == reveal.id))


def day_status(
    day: N1Day | None,
    reveal: N1Reveal | None,
    session: SessionRecord | None,
    on: date,
    today: date,
) -> str:
    """no_plan · pending · revealed · late_barrier · session · ineligible · eligible_no_session.

    A revealed slot makes the day a session day, analysed as assigned whether or not
    the session was begun ("revealed" only while today can still begin it). A barrier
    counts as ineligible only if reported before the planned start. A late barrier or
    a planned day that passed without a reveal counts as eligible_no_session.
    """
    if day is None:
        return "no_plan"
    if reveal is not None and (session is not None or on < today):
        return "session"
    if day.barrier is not None and not day.barrier_late:
        return "ineligible"
    if on < today:
        return "eligible_no_session"
    if day.barrier is not None:
        return "late_barrier"
    if reveal is not None:
        return "revealed"
    return "pending"


def window_from(reveal: N1Reveal, session: SessionRecord | None) -> datetime:
    """Start of the outcome window: the session end, its last save if it never ended,
    or the reveal time if it was never begun."""
    if session is None:
        return reveal.revealed_at
    return session.ended_at or session.last_saved_at


def study_start_target(db: Session, settings: Settings, now: datetime) -> N1Reveal | None:
    """The latest reveal of the current phase that has no study start yet.

    Every revealed slot is analysed as assigned, whether its session was completed,
    aborted, unfinished or never begun. Keyed to the session date, so a start logged
    after midnight still belongs to the evening session it follows.
    """
    phase = settings.n1_phase
    reveal = db.scalar(
        select(N1Reveal).where(N1Reveal.phase == phase).order_by(N1Reveal.revealed_at.desc())
    )
    if reveal is None:
        return None
    if db.get(N1StudyStart, (phase, reveal.session_date)) is not None:
        return None
    if now - window_from(reveal, _session_for(db, reveal)) > STUDY_START_WINDOW:
        return None
    return reveal


# ---------- actions ----------


def plan_day(db: Session, settings: Settings, now: datetime, on: date, start: time) -> N1Day:
    """Plans a future day. Plans are made the evening before (or earlier), never same day."""
    if on <= local_today(now, settings):
        raise N1Error(409, "Days are planned in advance: choose a future date.")
    day = _day(db, settings.n1_phase, on)
    if day is None:
        day = N1Day(phase=settings.n1_phase, date=on, planned_start=start, planned_at=now)
        db.add(day)
    else:
        day.planned_start, day.planned_at = start, now
    db.commit()
    return day


def report_barrier(db: Session, settings: Settings, now: datetime, reason: str) -> N1Day:
    phase, today = settings.n1_phase, local_today(now, settings)
    day = _day(db, phase, today)
    if day is None:
        raise N1Error(409, "Today has no plan, so it isn't an experiment day.")
    if day.barrier is not None:
        raise N1Error(409, "A day off is already recorded for today.")
    if _reveal_on(db, phase, today) is not None:
        raise N1Error(409, "Today's exercise has already been picked.")
    day.barrier, day.barrier_at = reason.strip(), now
    day.barrier_late = now > planned_start_at(day, settings)
    db.commit()
    return day


def reveal_today(db: Session, settings: Settings, now: datetime) -> N1Reveal:
    """Reveals today's slot, or returns it again if it is already revealed (continue)."""
    phase, today = settings.n1_phase, local_today(now, settings)
    existing = _reveal_on(db, phase, today)
    if existing is not None:
        return existing
    day = _day(db, phase, today)
    if day is None or day.planned_at.astimezone(zone(settings)).date() >= today:
        raise N1Error(409, "Only days planned in advance can have an exercise.")
    if day.barrier is not None:
        raise N1Error(409, "Today is marked as a day off.")

    used = set(db.scalars(select(N1Reveal.slot).where(N1Reveal.phase == phase)))
    slot = next((s for s in load_schedule(settings, phase) if s.slot not in used), None)
    if slot is None:
        raise N1Error(409, f"All exercises in part {phase} of the experiment have been used.")
    minutes = round((now - planned_start_at(day, settings)).total_seconds() / 60)
    reveal = N1Reveal(
        phase=phase,
        slot=slot.slot,
        condition=slot.condition,
        session_date=today,
        revealed_at=now,
        minutes_after_planned=minutes,
    )
    db.add(reveal)
    db.commit()
    return reveal


def record_study_start(db: Session, settings: Settings, now: datetime, text: str) -> N1StudyStart:
    reveal = study_start_target(db, settings, now)
    if reveal is None:
        raise N1Error(409, "There is no exercise waiting for a start to be recorded.")
    start = N1StudyStart(
        phase=reveal.phase, session_date=reveal.session_date, recorded_at=now, text=text.strip()
    )
    db.add(start)
    db.commit()
    _append_note(settings, reveal.session_date, now, start.text)
    return start


def _append_note(settings: Settings, on: date, now: datetime, text: str) -> None:
    """Readable mirror of the record. Append-only: the file is never replaced."""
    folder = Path(settings.n1_study_log_dir)
    folder.mkdir(parents=True, exist_ok=True)
    stamp = now.astimezone(zone(settings)).strftime("%H:%M")
    with (folder / f"{on.isoformat()}.md").open("a", encoding="utf-8") as f:
        f.write(f"{stamp} {text}\n")


# ---------- views ----------


def today_view(db: Session, settings: Settings, now: datetime) -> dict[str, Any]:
    phase, today = settings.n1_phase, local_today(now, settings)
    tomorrow = today + timedelta(days=1)
    day = _day(db, phase, today)
    reveal = _reveal_on(db, phase, today)
    session = _session_for(db, reveal)
    status = day_status(day, reveal, session, today, today)
    target = study_start_target(db, settings, now)
    recorded = db.get(N1StudyStart, (phase, today)) if reveal is not None else None
    tomorrow_day = _day(db, phase, tomorrow)
    before_start = day is not None and now <= planned_start_at(day, settings)

    return {
        "phase": phase,
        "test_phase": phase == 0,
        "session_mode": session_mode(phase),
        "timezone": settings.study_timezone,
        "today": today,
        "status": status,
        "plan": None
        if day is None
        else {
            "planned_start": day.planned_start.strftime("%H:%M"),
            "barrier": day.barrier,
            "barrier_late": day.barrier_late,
        },
        "reveal": None
        if reveal is None
        else {
            "id": reveal.id,
            "condition": reveal.condition,
            "revealed_at": reveal.revealed_at,
            "minutes_after_planned": reveal.minutes_after_planned,
            "late_start": reveal.minutes_after_planned > LATE_START_MINUTES,
        },
        "session": None if session is None else {"id": session.id, "status": session.status},
        "study_start_target": None
        if target is None
        else {
            "session_date": target.session_date,
            "window_from": window_from(target, _session_for(db, target)),
        },
        "study_start": None
        if recorded is None
        else {"session_date": recorded.session_date, "recorded_at": recorded.recorded_at},
        "tomorrow": tomorrow,
        "tomorrow_plan": None
        if tomorrow_day is None
        else {"planned_start": tomorrow_day.planned_start.strftime("%H:%M")},
        # Once the study start is recorded, the day's outcome is fixed.
        "can_start_session": status in ("pending", "revealed") and recorded is None,
        "can_report_barrier": status == "pending",
        "barrier_would_be_late": status == "pending" and not before_start,
        # Every revealed slot is a session day (protocol §5), so reveals are the count.
        "progress": {
            "session_days": db.scalar(
                select(func.count()).select_from(N1Reveal).where(N1Reveal.phase == phase)
            ),
            "planned_days": db.scalar(
                select(func.count()).select_from(N1Day).where(N1Day.phase == phase)
            ),
        },
    }


def export(db: Session, phase: int, settings: Settings) -> dict[str, Any]:
    """Everything the analysis needs for one phase, without free text."""
    reveals = list(db.scalars(select(N1Reveal).where(N1Reveal.phase == phase)))
    reveal_ids = [r.id for r in reveals]
    sessions = (
        list(db.scalars(select(SessionRecord).where(SessionRecord.n1_reveal_id.in_(reveal_ids))))
        if reveal_ids
        else []
    )
    days = list(db.scalars(select(N1Day).where(N1Day.phase == phase)))
    starts = list(db.scalars(select(N1StudyStart).where(N1StudyStart.phase == phase)))
    others = other_sessions(db, reveals, settings)
    return {
        "phase": phase,
        "timezone": settings.study_timezone,
        "late_start_minutes": LATE_START_MINUTES,
        "days": [
            {
                "date": d.date.isoformat(),
                "planned_start": d.planned_start.strftime("%H:%M"),
                "planned_at": d.planned_at.isoformat(),
                "barrier": d.barrier is not None,
                "barrier_at": d.barrier_at.isoformat() if d.barrier_at else None,
                "barrier_late": d.barrier_late,
            }
            for d in sorted(days, key=lambda d: d.date)
        ],
        "reveals": [
            {
                "id": str(r.id),
                "slot": r.slot,
                "condition": r.condition,
                "session_date": r.session_date.isoformat(),
                "revealed_at": r.revealed_at.isoformat(),
                "minutes_after_planned": r.minutes_after_planned,
                # Local midnight: the exposure window opens here (protocol §7).
                "day_start": local_midnight(r.session_date, settings).isoformat(),
            }
            for r in sorted(reveals, key=lambda r: r.revealed_at)
        ],
        "sessions": [
            {
                "id": str(s.id),
                "n1_reveal_id": str(s.n1_reveal_id),
                "condition": s.condition,
                "status": s.status,
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "last_saved_at": s.last_saved_at.isoformat(),
            }
            for s in sessions
        ],
        "study_starts": [
            {"session_date": s.session_date.isoformat(), "recorded_at": s.recorded_at.isoformat()}
            for s in sorted(starts, key=lambda s: s.session_date)
        ],
        # Exercises without a reveal (Try it) during the phase's days: no answers, no text.
        "other_sessions": [
            {
                "id": str(s.id),
                "mode": s.mode,
                "condition": s.condition,
                "status": s.status,
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            }
            for s in others
        ],
    }


def local_midnight(on: date, settings: Settings) -> datetime:
    return datetime.combine(on, time(0, 0), tzinfo=zone(settings))


def other_sessions(db: Session, reveals: list[N1Reveal], settings: Settings) -> list[SessionRecord]:
    """Sessions without a reveal from the first session day's midnight on.

    The range ends two days after the last session day, because an outcome window can
    run past midnight; the analysis applies each day's exact window.
    """
    if not reveals:
        return []
    first = min(r.session_date for r in reveals)
    last = max(r.session_date for r in reveals)
    query = (
        select(SessionRecord)
        .where(SessionRecord.n1_reveal_id.is_(None))
        .where(SessionRecord.started_at >= local_midnight(first, settings))
        .where(SessionRecord.started_at < local_midnight(last + timedelta(days=2), settings))
        .order_by(SessionRecord.started_at)
    )
    return list(db.scalars(query))
