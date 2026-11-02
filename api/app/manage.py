"""Local maintenance commands.

uv run python -m app.manage reset-db [--yes]      (refused in production)
uv run python -m app.manage backup
uv run python -m app.manage export-n1 --phase 1 --out ../data/exports/phase1.json
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, make_url, text
from sqlalchemy.orm import Session as SASession

from app import n1
from app.config import get_settings

API_DIR = Path(__file__).resolve().parents[1]
BACKUP_DIR = API_DIR.parent / "data" / "backups"


def alembic_config(database_url: str) -> Config:
    cfg = Config(str(API_DIR / "alembic.ini"))
    cfg.attributes["database_url"] = database_url
    return cfg


def recreate_schema(database_url: str) -> None:
    """Drop every object in the public schema, then migrate to the latest revision."""
    engine = create_engine(database_url)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    engine.dispose()
    command.upgrade(alembic_config(database_url), "head")


def backup(database_url: str) -> Path:
    pg_dump = shutil.which("pg_dump")
    if pg_dump is None:
        raise SystemExit("pg_dump not found on PATH; see docs/runbook.md prerequisites.")
    url = make_url(database_url)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    target = BACKUP_DIR / f"{url.database}-{datetime.now():%Y%m%d-%H%M%S}.sql"
    # Password goes through the environment, not the command line.
    env = {**os.environ, "PGPASSWORD": url.password or ""}
    subprocess.run(
        [
            pg_dump,
            "--host",
            url.host or "localhost",
            "--port",
            str(url.port or 5432),
            "--username",
            url.username or "",
            "--dbname",
            url.database or "",
            "--file",
            str(target),
        ],
        env=env,
        check=True,
    )
    return target


def reset_db(assume_yes: bool) -> None:
    settings = get_settings()
    if settings.app_env == "production":
        raise SystemExit("reset-db is refused in production: it would delete the experiment.")
    database_url = settings.database_url
    name = make_url(database_url).database
    if not assume_yes:
        answer = input(f"This deletes ALL data in '{name}' (including n-of-1 data). Type RESET: ")
        if answer.strip() != "RESET":
            print("Cancelled.")
            return
    saved = backup(database_url)
    print(f"Backup written to {saved}")
    recreate_schema(database_url)
    print(f"'{name}' recreated and migrated to head.")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m app.manage")
    sub = parser.add_subparsers(dest="command", required=True)
    reset = sub.add_parser(
        "reset-db", help="Back up, then drop and recreate the dev database schema."
    )
    reset.add_argument("--yes", action="store_true", help="Skip the confirmation prompt.")
    sub.add_parser("backup", help="Write a pg_dump backup of the database to data/backups/.")
    exp = sub.add_parser("export-n1", help="Write one phase's n-of-1 records as JSON.")
    exp.add_argument("--phase", type=int, required=True)
    exp.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command == "reset-db":
        reset_db(args.yes)
    elif args.command == "backup":
        print(f"Backup written to {backup(get_settings().database_url)}")
    elif args.command == "export-n1":
        export_n1(args.phase, args.out)


def export_n1(phase: int, out: Path) -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url)
    with SASession(engine) as db:
        data = n1.export(db, phase, settings)
    engine.dispose()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out} ({len(data['reveals'])} reveals, {len(data['days'])} days)")


if __name__ == "__main__":
    main(sys.argv[1:])
