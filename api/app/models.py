import uuid
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

MODES = ("self_use", "usability", "dev")
CONDITIONS = (
    # n-of-1 phase 1: plan factor
    "action_bridge",
    "goal_restatement",
    # n-of-1 phase 2: pre-task factor, Action Bridge held constant
    "state_reset+action_bridge",
    "game_only+action_bridge",
)
STATUSES = ("in_progress", "completed", "aborted")


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


class SessionRecord(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint(_in("mode", MODES), name="ck_sessions_mode"),
        CheckConstraint(_in("condition", CONDITIONS), name="ck_sessions_condition"),
        CheckConstraint(_in("status", STATUSES), name="ck_sessions_status"),
        CheckConstraint("ended_at IS NULL OR ended_at >= started_at", name="ck_sessions_times"),
    )

    # Client-generated, so repeated PUTs of the same session are idempotent.
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    mode: Mapped[str] = mapped_column(String(20))
    condition: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20))
    # Exact content and measure versions shown in this session: {content_id: version}.
    content_versions: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb")
    )
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    plan: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ratings: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    followup: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Set for n-of-1 sessions: the reveal that assigned this session's condition.
    n1_reveal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("n1_reveals.id"), unique=True
    )
    # Server time of the last save while the session ran (follow-ups don't change it).
    # For a session that never finished, the n-of-1 outcome window starts here.
    last_saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class N1Day(Base):
    """A planned n-of-1 day. Dates are local (study_timezone)."""

    __tablename__ = "n1_days"

    phase: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    planned_start: Mapped[time] = mapped_column(Time)
    planned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    barrier: Mapped[str | None] = mapped_column(Text)
    barrier_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # True when the barrier was reported after the planned start: the day then
    # counts as eligible_no_session, not ineligible.
    barrier_late: Mapped[bool | None] = mapped_column(Boolean)


class N1Reveal(Base):
    """One revealed schedule slot. A slot is revealed at most once, one per day."""

    __tablename__ = "n1_reveals"
    __table_args__ = (
        UniqueConstraint("phase", "slot", name="uq_n1_reveals_phase_slot"),
        UniqueConstraint("phase", "session_date", name="uq_n1_reveals_phase_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phase: Mapped[int] = mapped_column(Integer)
    slot: Mapped[int] = mapped_column(Integer)
    condition: Mapped[str] = mapped_column(String(50))
    session_date: Mapped[date] = mapped_column(Date)
    revealed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Minutes between the planned start and the reveal (negative if early).
    minutes_after_planned: Mapped[int] = mapped_column(Integer)


class N1StudyStart(Base):
    """The day's "I'm starting to study now" record; server time is the outcome."""

    __tablename__ = "n1_study_starts"

    phase: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_date: Mapped[date] = mapped_column(Date, primary_key=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    text: Mapped[str] = mapped_column(Text)
