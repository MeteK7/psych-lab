# Local runbook (Windows, native PostgreSQL)

Everything runs on this computer only. The API listens on `127.0.0.1:8100`, the web app on `localhost:4300`, and PostgreSQL on `localhost:5432`. These ports were chosen so that this project can run alongside other local projects on 4200 and 8000.

**Layout:** the project root is `C:\Projects\new_project`. The platform (this runbook, `api`, `web`, `analysis`, `scripts`, `data`, `.env`) is in `C:\Projects\new_project\platform`, and the n-of-1 study log is the plain folder `C:\Projects\new_project\study-log`. **All commands below run from `C:\Projects\new_project\platform`** unless they give an absolute path.

The app connects as the `postgres` superuser (decided 2026-10-29). That's acceptable for local-only use, but the app and tests can affect any database on this server, so keep `DATABASE_URL` and `TEST_DATABASE_URL` pointed at `app_dev` and `app_test`.

## Prerequisites (one time)
| Tool | Check | Notes |
|---|---|---|
| PostgreSQL 18 (Windows service `postgresql-x64-18`) | `Get-Service postgresql-x64-18` | Set `listen_addresses = 'localhost'` in `C:\Program Files\PostgreSQL\18\data\postgresql.conf` |
| `psql`, `pg_dump` on PATH | `psql --version; pg_dump --version` | Add `C:\Program Files\PostgreSQL\18\bin` to the user PATH. `reset-db` needs `pg_dump` |
| uv + Python 3.13 | `uv --version; uv python list --only-installed` | `uv python install 3.13`. Checks run with `UV_PYTHON_DOWNLOADS=never` |
| Node.js LTS | `node --version` | v24 is in use |

### Database (one time)
In `psql -U postgres -h localhost`:
```sql
CREATE DATABASE app_dev;
CREATE DATABASE app_test;
```

### Configuration
Copy `.env.example` to `.env` in `platform\` and fill in the `postgres` password. `.env` is git-ignored.
- To check that the saved file works (not what the editor shows), run this from `api/`; it prints `postgres` on success:
  ```powershell
  uv run python -c "from sqlalchemy import create_engine, text; from app.config import get_settings; print(create_engine(get_settings().database_url).connect().execute(text('select current_user')).scalar())"
  ```
- Percent-encode special characters in the password (see the comments in `.env.example`).
- `TEST_DATABASE_URL` must point to `app_test`. Tests drop and recreate its schema on every run.

## Install and migrate
```powershell
cd api; uv sync; uv run alembic upgrade head
```
```powershell
cd web; npm ci
```

## Start (two terminals)
```powershell
cd api; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8100 --reload-dir app
```
```powershell
cd web; npm start
```
Open http://localhost:4300. The dev server proxies `/api` to the API, so the browser sees a single origin. API docs are at http://localhost:4300/api/docs.
- `--reload-dir app` matters. Without it, the reloader also watches `api/.venv` and keeps restarting the API.
- If a port is taken, check what owns it with `Get-NetTCPConnection -State Listen -LocalPort 4300,8100`.

## Daily use (n-of-1): everything on the Today page
Start the API and the web app (above), open http://localhost:4300, and use **Today**:
1. **Plan tomorrow:** set the planned start time. Only future days can be planned.
2. **I can't study today:** a reason is required. Before the planned start the day becomes `ineligible`; after it, the barrier is flagged late (the page warns).
3. **Start today's session:** the server reveals today's slot and opens the session with that condition locked. **Begin session**, then complete it. **Continue today's session** reopens the same slot. From the reveal on, the day counts as assigned, even if the session is never begun.
4. **I'm starting to study now:** shown at the top of Today once today's slot is revealed, also after a session that was stopped, left unfinished or never begun. One line about what you're starting. The server records the time and appends the line to `C:\Projects\new_project\study-log\<session date>.md`.
5. **End of day:** **History** → **Add follow-up**.

- Dates follow local time (Europe/Istanbul).
- The current phase comes from `N1_PHASE` in `.env` (default 1).
- No files are edited by hand.

**Development page** (`/dev`): try any condition. Sessions are saved in `dev` mode and are never part of the study. Nothing is recorded until **Begin session**, so reloading never creates a session.

| Condition | Steps |
|---|---|
| Action Bridge / Goal restatement (phase 1) | unpleasantness rating → plan or goal → rating |
| State Reset / Game only, then Action Bridge (phase 2) | rating → about 4.5 min game (8 × 24 s, with a 10 s hold first and 10 s pauses between sets; content v2) → Action Bridge → rating |

- The game accepts pointer or arrow keys.
- With reduced motion turned on in Windows, the dot moves at half speed.

## n-of-1 export and analysis (developer task)
- The procedure is in `docs/protocol-n-of-1.md`. Schedules are in `analysis/schedules/` and are generated once per phase. **Never open them directly.** The server reads them, hash-checked.
- Export one phase (no free text), then analyse:
  ```powershell
  cd api; uv run python -m app.manage export-n1 --phase 1 --out ../data/exports/phase1.json
  ```
  ```powershell
  cd analysis; uv run python n_of_1.py --phase 1 --export ../data/exports/phase1.json --out ../data/exports/phase1-days.csv
  ```
- `data/` is git-ignored.

## Test phase (phase 0) for walkthroughs
Run a second API instance with test settings, so real phase-1 records are never touched:
```powershell
cd api; $env:N1_PHASE='0'; $env:N1_SCHEDULE_DIR='<folder with schedule-phase0.*>'; $env:N1_STUDY_LOG_DIR='<scratch folder>'; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8100 --reload-dir app
```
- Generate a phase-0 schedule with `analysis/make_schedule.py --phase 0 --out <folder>`.
- Afterwards, delete the phase-0 rows (`DELETE FROM n1_study_starts WHERE phase=0`, and likewise for `n1_reveals` after their `dev` sessions, and `n1_days`).

## Checks
```powershell
powershell -File scripts/check.ps1
```
This runs ruff (lint and format), pytest against `app_test`, the Angular unit tests (Vitest), and the production build.

## Reset the dev database
```powershell
cd api; uv run python -m app.manage reset-db
```
- Asks you to type `RESET`.
- Writes a `pg_dump` backup to `data/backups/` (git-ignored).
- Drops and recreates the `public` schema, then migrates to the latest revision.
- **This deletes n-of-1 data**; the backup is the only copy.

To restore a backup:
```powershell
psql -h localhost -U postgres -d app_dev -f data/backups/<file>.sql
```
Run this on an empty schema (for example, straight after a reset).

## Stop
- Press Ctrl+C in both terminals.
- PostgreSQL can keep running. To stop it, use `Stop-Service postgresql-x64-18` in an administrator PowerShell.

## Level-A API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness and database check |
| PUT | `/api/sessions/{id}` | Idempotent upsert. The client generates the UUID. Finished sessions accept only identical retries (409 otherwise) |
| GET | `/api/sessions?mode=&limit=` | History, newest first |
| PATCH | `/api/sessions/{id}/follow-up` | End-of-day self-report |
| GET | `/api/n1/today` | Today page state (local dates) |
| PUT | `/api/n1/days/{date}` | Plan a future day |
| POST | `/api/n1/barrier` | Report a barrier (flagged late after the planned start) |
| POST | `/api/n1/reveal` | Reveal today's slot (same reveal if repeated) |
| POST | `/api/n1/study-start` | Record the study start for the latest finished session |

Writes require the `X-Client: platform-web` header, `Content-Type: application/json`, and (if sent) an allowed `Origin`. Unknown `Host` headers are rejected.
