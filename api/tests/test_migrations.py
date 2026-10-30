from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import Engine

from app import models  # noqa: F401
from app.db import Base


def test_migrations_match_models(engine: Engine) -> None:
    # The engine fixture has already upgraded an empty database to head.
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diff == []
