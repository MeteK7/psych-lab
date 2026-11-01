import uuid

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import Engine, text

from app import models  # noqa: F401
from app.config import Settings
from app.db import Base
from app.manage import alembic_config


def test_migrations_match_models(engine: Engine) -> None:
    # The engine fixture has already upgraded an empty database to head.
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diff == []


def test_0004_moves_try_it_rows_to_try_and_keeps_test_mode_rows(
    engine: Engine, settings: Settings
) -> None:
    assert settings.test_database_url is not None
    cfg = alembic_config(settings.test_database_url)
    reveal, test_mode, practice = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    command.downgrade(cfg, "0003")
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO n1_reveals (id, phase, slot, condition, session_date,"
                    " revealed_at, minutes_after_planned) VALUES (:id, 0, 1,"
                    " 'action_bridge', '2026-11-01', now(), 0)"
                ),
                {"id": reveal},
            )
            for session_id, reveal_id in ((test_mode, reveal), (practice, None)):
                conn.execute(
                    text(
                        "INSERT INTO sessions (id, mode, condition, status, started_at,"
                        " n1_reveal_id) VALUES (:id, 'dev', 'action_bridge', 'completed',"
                        " now(), :reveal)"
                    ),
                    {"id": session_id, "reveal": reveal_id},
                )
        command.upgrade(cfg, "head")
        with engine.connect() as conn:
            modes = dict(conn.execute(text("SELECT id, mode FROM sessions")).all())
        assert modes == {test_mode: "dev", practice: "try"}
    finally:
        command.upgrade(cfg, "head")
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM sessions"))
            conn.execute(text("DELETE FROM n1_reveals"))
