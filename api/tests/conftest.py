import hashlib
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Connection, Engine, create_engine, make_url
from sqlalchemy.orm import Session

from app.clock import get_now
from app.config import PRODUCTION_DATABASE, Settings, get_settings
from app.db import get_db
from app.main import create_app
from app.manage import recreate_schema
from app.security import CLIENT_HEADER, CLIENT_VALUE

# Test schedules: phase 1 starts with goal_restatement, then action_bridge, ...
TEST_SCHEDULE = [
    (1, 1, "goal_restatement"),
    (2, 1, "action_bridge"),
    (3, 2, "action_bridge"),
    (4, 2, "goal_restatement"),
]


@pytest.fixture(scope="session")
def settings() -> Settings:
    settings = get_settings()
    if not settings.test_database_url:
        pytest.exit("TEST_DATABASE_URL is not set in .env; see docs/runbook.md.", returncode=2)
    test_db = make_url(settings.test_database_url).database
    if test_db == make_url(settings.database_url).database:
        pytest.exit("TEST_DATABASE_URL must point to a different database than DATABASE_URL.", 2)
    if test_db == PRODUCTION_DATABASE:
        pytest.exit(f"TEST_DATABASE_URL must never point to {PRODUCTION_DATABASE}.", 2)
    return settings


@pytest.fixture(scope="session")
def engine(settings: Settings) -> Iterator[Engine]:
    # Fresh schema per test run: proves migrations apply cleanly to an empty database.
    assert settings.test_database_url is not None
    recreate_schema(settings.test_database_url)
    engine = create_engine(settings.test_database_url)
    yield engine
    engine.dispose()


@pytest.fixture
def connection(engine: Engine) -> Iterator[Connection]:
    with engine.connect() as conn:
        outer = conn.begin()
        yield conn
        outer.rollback()


@dataclass
class Clock:
    now: datetime

    def set(self, iso: str) -> None:
        self.now = datetime.fromisoformat(iso)


def write_schedule(folder: Path, phase: int, rows: list[tuple[int, int, str]]) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    csv_path = folder / f"schedule-phase{phase}.csv"
    body = "slot,pair,condition\n" + "".join(f"{s},{p},{c}\n" for s, p, c in rows)
    csv_path.write_bytes(body.encode("utf-8"))
    digest = hashlib.sha256(csv_path.read_bytes()).hexdigest()
    (folder / f"schedule-phase{phase}.sha256").write_text(f"{digest}  {csv_path.name}\n")
    return csv_path


@pytest.fixture
def clock() -> Clock:
    return Clock(datetime(2026, 11, 2, 9, 0, tzinfo=UTC))


@pytest.fixture
def n1_settings(settings: Settings, tmp_path: Path) -> Settings:
    schedules = tmp_path / "schedules"
    write_schedule(schedules, 1, TEST_SCHEDULE)
    write_schedule(schedules, 0, TEST_SCHEDULE)
    return settings.model_copy(
        update={
            "n1_phase": 1,
            "n1_schedule_dir": schedules,
            "n1_study_log_dir": tmp_path / "study-log",
            "study_timezone": "Europe/Istanbul",
        }
    )


@pytest.fixture
def client(n1_settings: Settings, connection: Connection, clock: Clock) -> Iterator[TestClient]:
    app = create_app(n1_settings)

    def _db() -> Iterator[Session]:
        # Commits inside the app become savepoints; the outer transaction is rolled back.
        with Session(bind=connection, join_transaction_mode="create_savepoint") as db:
            yield db

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_settings] = lambda: n1_settings
    app.dependency_overrides[get_now] = lambda: clock.now
    with TestClient(
        app, base_url="http://localhost", headers={CLIENT_HEADER: CLIENT_VALUE}
    ) as test_client:
        yield test_client
