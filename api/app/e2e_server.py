"""API server for the browser tests (web/e2e), always on the test database.

uv run python -m app.e2e_server --port 8120 --origin http://localhost:4320

The booth's browser tests (web/playwright.booth.config.ts) add --booth: the booth profile, a
test support line, a short idle time, and one exercise rated safe for the tests only (no
exercise is rated yet; app/schemas.py SAFE_UNSUPERVISED_EXERCISES stays empty in the code).

Before anything connects, every setting is pointed at TEST_DATABASE_URL, whose schema is
then recreated, so the browser tests never touch app_dev or app_prod. The server runs Test
mode (phase 0) with a fixed schedule and a study log in a temporary folder.
"""

import argparse
import hashlib
import os
import sys
import tempfile
from pathlib import Path

from sqlalchemy import make_url

from app.config import PRODUCTION_DATABASE, Settings

# Blocked pairs, both orders, so walkthroughs see both phase-1 exercises.
E2E_SCHEDULE = [
    (1, 1, "action_bridge"),
    (2, 1, "goal_restatement"),
    (3, 2, "goal_restatement"),
    (4, 2, "action_bridge"),
]


# Rated safe for the booth's browser tests only, so a visit can run end to end.
BOOTH_TEST_EXERCISES = ("goal_restatement",)


def e2e_environment(settings: Settings, folder: Path, origin: str) -> dict[str, str]:
    """Environment variables that move every setting onto the test database."""
    if not settings.test_database_url:
        raise SystemExit("TEST_DATABASE_URL is not set in .env; see docs/runbook.md.")
    test_db = make_url(settings.test_database_url).database
    if test_db in (make_url(settings.database_url).database, PRODUCTION_DATABASE):
        raise SystemExit(
            "TEST_DATABASE_URL must be a separate test database, never app_dev or app_prod."
        )
    return {
        "APP_ENV": "development",
        "DATABASE_URL": settings.test_database_url,
        "N1_PHASE": "0",
        "N1_SCHEDULE_DIR": str(folder / "schedules"),
        "N1_STUDY_LOG_DIR": str(folder / "study-log"),
        "ALLOWED_ORIGINS": origin,
    }


def write_schedule(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    csv_path = folder / "schedule-phase0.csv"
    body = "slot,pair,condition\n" + "".join(f"{s},{p},{c}\n" for s, p, c in E2E_SCHEDULE)
    csv_path.write_bytes(body.encode("utf-8"))
    digest = hashlib.sha256(csv_path.read_bytes()).hexdigest()
    (folder / "schedule-phase0.sha256").write_text(f"{digest}  {csv_path.name}\n")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m app.e2e_server")
    parser.add_argument("--port", type=int, default=8120)
    parser.add_argument("--origin", default="http://localhost:4320")
    parser.add_argument("--booth", action="store_true", help="run the booth profile")
    args = parser.parse_args(argv)

    folder = Path(tempfile.mkdtemp(prefix="e2e-"))
    os.environ.update(e2e_environment(Settings(), folder, args.origin))  # type: ignore[call-arg]
    write_schedule(folder / "schedules")
    if args.booth:
        os.environ.update(
            {
                "APP_PROFILE": "booth",
                "BOOTH_SUPPORT_LINE": "Test support line: 0000",
                "BOOTH_IDLE_SECONDS": "30",
            }
        )
        from app import schemas

        schemas.SAFE_UNSUPERVISED_EXERCISES = BOOTH_TEST_EXERCISES

    # Imported only now, so cached settings and engines see the test database.
    import uvicorn

    from app.config import get_settings
    from app.main import create_app
    from app.manage import recreate_schema

    get_settings.cache_clear()
    settings = get_settings()
    recreate_schema(settings.database_url)
    profile = "booth" if args.booth else "standard"
    print(f"e2e API on port {args.port}, test database, Test mode, {profile}", file=sys.stderr)
    uvicorn.run(create_app(settings, enforce_environment=True), host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main(sys.argv[1:])
