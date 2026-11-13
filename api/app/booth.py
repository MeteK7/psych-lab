"""The booth profile (docs/product-model.md §6, M1): a Try it deployment for visitors.

One visitor must never see another's records, so everything that reads records, and the
experiment, is refused there. Only exercises rated safe for unsupervised use run.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app import schemas
from app.config import Settings, get_settings


def booth_exercises() -> list[str]:
    """Read at call time, so the browser tests can rate a test exercise (app/e2e_server.py)."""
    return [e for e in schemas.SAFE_UNSUPERVISED_EXERCISES if e not in schemas.EXCLUDED_FROM_BOOTH]


def not_in_booth(settings: Annotated[Settings, Depends(get_settings)]) -> None:
    if settings.app_profile == "booth":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not available here.")
