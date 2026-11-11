from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.booth import booth_exercises
from app.config import Settings, get_settings
from app.db import get_db
from app.schemas import Booth, Health

router = APIRouter(tags=["health"])


@router.get("/health", response_model=Health)
def health(
    db: Annotated[Session, Depends(get_db)], settings: Annotated[Settings, Depends(get_settings)]
) -> Health:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable.") from exc
    booth = None
    if settings.app_profile == "booth":
        booth = Booth(
            support_line=settings.booth_support_line,
            idle_seconds=settings.booth_idle_seconds,
            exercises=booth_exercises(),
        )
    return Health(
        status="ok",
        database="ok",
        environment=settings.app_env,
        profile=settings.app_profile,
        booth=booth,
    )
