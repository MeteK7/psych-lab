import uuid
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clock import get_now
from app.config import Settings, get_settings
from app.db import get_db
from app.models import N1Reveal, SessionRecord
from app.n1 import session_mode
from app.schemas import DEVELOPMENT_ONLY_EXERCISES, FollowUp, Mode, SessionOut, SessionUpsert

router = APIRouter(tags=["sessions"])

DbSession = Annotated[Session, Depends(get_db)]
Now = Annotated[datetime, Depends(get_now)]
AppSettings = Annotated[Settings, Depends(get_settings)]


def _fields(body: SessionUpsert) -> dict[str, Any]:
    dumped = body.model_dump(mode="json")
    return {
        "mode": body.mode,
        "condition": body.condition,
        "status": body.status,
        "content_versions": dumped["content_versions"],
        "steps": dumped["steps"],
        "plan": dumped["plan"],
        "ratings": dumped["ratings"],
        "started_at": body.started_at,
        "ended_at": body.ended_at,
        "n1_reveal_id": body.n1_reveal_id,
    }


def _matches(record: SessionRecord, fields: dict[str, Any]) -> bool:
    return all(getattr(record, name) == value for name, value in fields.items())


def _check_reveal(body: SessionUpsert, session_id: uuid.UUID, db: Session) -> None:
    """An n-of-1 session must use its reveal's condition, mode, and one session per reveal."""
    if body.n1_reveal_id is None:
        return
    reveal = db.get(N1Reveal, body.n1_reveal_id)
    if reveal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reveal not found.")
    if body.condition != reveal.condition or body.mode != session_mode(reveal.phase):
        raise HTTPException(status.HTTP_409_CONFLICT, "Session does not match its reveal.")
    other = db.scalar(
        select(SessionRecord.id).where(
            SessionRecord.n1_reveal_id == reveal.id, SessionRecord.id != session_id
        )
    )
    if other is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This reveal already has a session.")


@router.put(
    "/sessions/{session_id}",
    response_model=SessionOut,
    responses={201: {"model": SessionOut}, 409: {"description": "Session already finished"}},
)
def upsert_session(
    session_id: uuid.UUID,
    body: SessionUpsert,
    response: Response,
    db: DbSession,
    now: Now,
    settings: AppSettings,
) -> SessionRecord:
    if settings.app_env == "production" and body.condition in DEVELOPMENT_ONLY_EXERCISES:
        # Released only once its content review and full-text gates pass.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This exercise isn't released yet.")
    fields = _fields(body)
    _check_reveal(body, session_id, db)
    record = db.get(SessionRecord, session_id)
    if record is None:
        record = SessionRecord(id=session_id, last_saved_at=now, **fields)
        db.add(record)
        db.commit()
        db.refresh(record)
        response.status_code = status.HTTP_201_CREATED
        return record

    if record.status != "in_progress":
        # A finished session is immutable; an identical retry is still accepted.
        if _matches(record, fields):
            return record
        raise HTTPException(status.HTTP_409_CONFLICT, "Session is finished and cannot be changed.")

    for name, value in fields.items():
        setattr(record, name, value)
    record.last_saved_at = now
    db.commit()
    db.refresh(record)
    return record


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    db: DbSession,
    mode: Mode | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[SessionRecord]:
    query = select(SessionRecord).order_by(SessionRecord.started_at.desc()).limit(limit)
    if mode is not None:
        query = query.where(SessionRecord.mode == mode)
    return list(db.scalars(query))


@router.patch("/sessions/{session_id}/follow-up", response_model=SessionOut)
def record_follow_up(session_id: uuid.UUID, body: FollowUp, db: DbSession) -> SessionRecord:
    record = db.get(SessionRecord, session_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found.")
    record.followup = {**body.model_dump(), "recorded_at": datetime.now(UTC).isoformat()}
    db.commit()
    db.refresh(record)
    return record
