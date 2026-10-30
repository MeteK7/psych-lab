from datetime import date, datetime, time
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app import n1
from app.clock import get_now
from app.config import Settings, get_settings
from app.db import get_db

router = APIRouter(prefix="/n1", tags=["n-of-1"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentSettings = Annotated[Settings, Depends(get_settings)]
Now = Annotated[datetime, Depends(get_now)]


class PlanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    planned_start: time


class BarrierIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=1, max_length=300)


class StudyStartIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=300)


def _call(fn: Any, *args: Any) -> Any:
    try:
        return fn(*args)
    except n1.N1Error as exc:
        raise HTTPException(exc.status_code, exc.detail) from exc


@router.get("/today")
def today(db: DbSession, settings: CurrentSettings, now: Now) -> dict[str, Any]:
    return n1.today_view(db, settings, now)


@router.put("/days/{on}")
def plan(
    on: date, body: PlanIn, db: DbSession, settings: CurrentSettings, now: Now
) -> dict[str, Any]:
    _call(n1.plan_day, db, settings, now, on, body.planned_start)
    return n1.today_view(db, settings, now)


@router.post("/barrier")
def barrier(body: BarrierIn, db: DbSession, settings: CurrentSettings, now: Now) -> dict[str, Any]:
    _call(n1.report_barrier, db, settings, now, body.reason)
    return n1.today_view(db, settings, now)


@router.post("/reveal")
def reveal(db: DbSession, settings: CurrentSettings, now: Now) -> dict[str, Any]:
    _call(n1.reveal_today, db, settings, now)
    return n1.today_view(db, settings, now)


@router.post("/study-start")
def study_start(
    body: StudyStartIn, db: DbSession, settings: CurrentSettings, now: Now
) -> dict[str, Any]:
    _call(n1.record_study_start, db, settings, now, body.text)
    return n1.today_view(db, settings, now)
