# Local runbook (Windows, native PostgreSQL)

Everything runs on this computer only, in **two environments** (below). PostgreSQL listens on `localhost:5432`. The ports were chosen so that this project can run alongside other local projects on 4200 and 8000.

**Layout:** the project root is `C:\Projects\new_project`.
- `platform\`: **development**, branch `test-n552vx` (this runbook, `api`, `web`, `analysis`, `scripts`, `data`, `.env`)
- `platform-prod\`: **production**, a git worktree of `main` with its own `.env`
- `study-log\`: the n-of-1 study log, a plain folder written only by production

Commands below run from the environment's folder (`platform\` or `platform-prod\`) unless they give an absolute path.

The app connects as the `postgres` superuser (decided 2026-10-29). That's acceptable for local-only use, but the app and tests can affect any database on this server. The guards below keep each environment on its own databases.

## Environments
| | Development | Production |
|---|---|---|
| Folder and branch | `platform\`, `test-n552vx` | `platform-prod\`, `main` |
| Purpose | Building and testing; **Test mode only** (phase 0) | **Your n-of-1 experiment** and everyday use |
| Databases | `app_dev`, tests `app_test` | `app_prod`, tests `app_test_main` (release checks only) |
| `.env` | `APP_ENV=development`, `N1_PHASE=0`, `ALLOWED_ORIGINS=http://localhost:4310` | `APP_ENV=production`, `N1_PHASE=1` (later 2), `ALLOWED_ORIGINS=http://localhost:4300` |
| Study log | `platform\data\study-log-dev\` | `C:\Projects\new_project\study-log` |
| Address | http://localhost:4310 (API on 8110) | http://localhost:4300 (one process serves the app and the API) |
| On screen | A **Development** badge in the header | No badge |

**Guards** (the server refuses to start and says what to fix):
- Development refuses the database `app_prod`, any `N1_PHASE` other than 0, and the experiment's study log.
- Production requires `app_prod`, `N1_PHASE` 1 or 2, the schedules in `analysis\schedules`, the study log `C:\Projects\new_project\study-log`, and a built web app.
- Tests refuse `app_prod`. `reset-db` is refused in production.

Development never affects the experiment: it has its own branch, folder, databases, study log and ports.

## Prerequisites (one time)
| Tool | Check | Notes |
|---|---|---|
| PostgreSQL 18 (Windows service `postgresql-x64-18`) | `Get-Service postgresql-x64-18` | Set `listen_addresses = 'localhost'` in `C:\Program Files\PostgreSQL\18\data\postgresql.conf` |
| `psql`, `pg_dump` on PATH | `psql --version; pg_dump --version` | Add `C:\Program Files\PostgreSQL\18\bin` to the user PATH. `reset-db` and `backup` need `pg_dump` |
| uv + Python 3.13 | `uv --version; uv python list --only-installed` | `uv python install 3.13`. Checks run with `UV_PYTHON_DOWNLOADS=never` |
| Node.js LTS | `node --version` | v24 is in use |

## One-time setup: development (`platform\`, branch `test-n552vx`)
1. **Branch** (you do all git actions). In `C:\Projects\new_project\platform`, after committing your work on `main`:
   ```powershell
   git switch -c test-n552vx
   ```
2. **Databases**, in `psql -U postgres -h localhost` (skip any that already exist):
   ```sql
   CREATE DATABASE app_dev;
   CREATE DATABASE app_test;
   ```
3. **`.env`:** copy the development block of `.env.example` to `.env` and fill in the password. If you already have a `.env`, set `APP_ENV=development`, `N1_PHASE=0` and `ALLOWED_ORIGINS=http://localhost:4310`.
4. **Install and migrate:**
   ```powershell
   cd api; uv sync; uv run alembic upgrade head
   ```
   ```powershell
   cd web; npm ci
   ```

## One-time setup: production (`platform-prod\`, `main`)
1. **Worktree** (in `C:\Projects\new_project\platform`, once `main` holds the release you want to run; see "Release to production"):
   ```powershell
   git worktree add ..\platform-prod main
   ```
2. **Databases**, in `psql -U postgres -h localhost`:
   ```sql
   CREATE DATABASE app_prod;
   CREATE DATABASE app_test_main;
   ```
3. **`.env`:** in `C:\Projects\new_project\platform-prod`, create `.env` from the production block of `.env.example` (remove the `#` signs, fill in the password).
4. **Install, migrate and build** (from `platform-prod\`):
   ```powershell
   cd api; uv sync; uv run alembic upgrade head
   ```
   ```powershell
   cd web; npm ci; npm run build
   ```
5. **Check** that the saved `.env` works. Run this from `platform-prod\api`; it prints `app_prod`:
   ```powershell
   uv run python -c "from sqlalchemy import create_engine, text; from app.config import get_settings; print(create_engine(get_settings().database_url).connect().execute(text('select current_database()')).scalar())"
   ```

Percent-encode special characters in the password (see the comments in `.env.example`). `.env` is git-ignored.

## Start production (one terminal)
From `C:\Projects\new_project\platform-prod`:
```powershell
cd api; uv run fastapi run app/main.py --host 127.0.0.1 --port 4300
```
Open http://localhost:4300 (My experiment: http://localhost:4300/experiment). There is no dev server and no reloading; the app is the built release.

**Smoke check after a start or release** (read-only): http://localhost:4300/api/health shows `"environment":"production"`, and http://localhost:4300/experiment loads without a Development badge.

## Start development (two terminals)
From `C:\Projects\new_project\platform`:
```powershell
cd api; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8110 --reload-dir app
```
```powershell
cd web; npm start
```
Open http://localhost:4310. The dev server proxies `/api` to the API, so the browser sees a single origin. API docs are at http://localhost:4310/api/docs.
- `--reload-dir app` matters. Without it, the reloader also watches `api/.venv` and keeps restarting the API.
- If a port is taken, check what owns it with `Get-NetTCPConnection -State Listen -LocalPort 4300,4310,8110`.

## Release to production
Development's checks must be green on `test-n552vx` first (`powershell -File scripts/check.ps1`). Then:
1. **Back up** production (from `platform-prod\`):
   ```powershell
   cd api; uv run python -m app.manage backup
   ```
2. **Stop** production (Ctrl+C), then **merge** (you do all git actions), from `platform-prod\`:
   ```powershell
   git merge test-n552vx
   ```
3. **Install, migrate, build** (from `platform-prod\`):
   ```powershell
   cd api; uv sync; uv run alembic upgrade head
   ```
   ```powershell
   cd web; npm ci; npm run build
   ```
4. **Optional release check** against `app_test_main`: `powershell -File scripts/check.ps1` from `platform-prod\`.
5. **Start** production and run the smoke check.

**During an n-of-1 phase** (protocol §8):
- Log every release with its date.
- A release must not change any experiment exercise, a content version in use, the n-of-1 logic or the analysis.
- A change that would is a protocol amendment and applies only to later days.

## Pages
- **Home** (`/`): the areas. Only **Action and growth** is available; the others are shown as planned.
- **Area page** (`/areas/action-growth`): the experiences, each with **Try it**. Try it is saved in `try` mode and is never part of the experiment.
- **My experiment** (`/experiment`), **My records** (`/records`), **About** (`/about`, includes the local server status).
- Old links `/dev` and `/history` redirect.

## Daily use (n-of-1, production): everything on My experiment
Start production, then open http://localhost:4300/experiment:
1. **Plan tomorrow:** set the planned start time. Only future days can be planned.
2. **I can't learn today → Mark today as a day off:** a reason is required. Before the planned start the day becomes `ineligible`; after it, the barrier is flagged late (the page warns).
3. **Start today's exercise:** the server reveals today's slot and opens the exercise with that condition locked. **Begin**, then complete it. **Continue today's exercise** reopens the same slot. From the reveal on, the day counts as assigned, even if the session is never begun.
4. **Starting to learn? → I'm starting now:** shown at the top of My experiment once today's slot is revealed, also after a session that was stopped, left unfinished or never begun. Write one line about what you're starting. The server records the time and appends the line to `C:\Projects\new_project\study-log\<session date>.md`.
5. **End of day:** **My records** → **Add follow-up**.

- Dates follow local time (Europe/Istanbul).
- The current phase comes from `N1_PHASE` in `platform-prod\.env`.
- No files are edited by hand.

**Practice:** **Try it** on the area page runs any experience in `try` mode. It stays fully available during the experiment: runs are recorded and handled by the exposure rule (protocol §7), never blocked. Nothing is recorded until **Begin**, so reloading never creates a session.

| Condition (on screen) | Steps |
|---|---|
| Action Bridge ("Plan your first step") / Goal restatement ("Write down your goal"), phase 1 | unpleasantness rating → plan or goal → rating |
| State Reset ("Picture it, then follow the dot") / Game only ("Follow the dot, then plan"), phase 2 | rating → intro → (image variant: picture step and picture ratings) → labelled preview and 15 s practice round → 10 s hold → 8 × 24 s rounds with 10 s pauses (content v3) → Action Bridge → rating |

- The game accepts pointer or arrow keys.
- With reduced motion turned on in Windows, the dot moves at half speed.

## n-of-1 export and analysis (developer task, production data)
- The procedure is in `docs/protocol-n-of-1.md`. Schedules are in `analysis/schedules/` and are generated once per phase. **Never open them directly.** The server reads them, hash-checked.
- Export one phase (no free text; includes Try it runs on session days for the exposure rule), then analyse. Run from `platform-prod\`:
  ```powershell
  cd api; uv run python -m app.manage export-n1 --phase 1 --out ../data/exports/phase1.json
  ```
  ```powershell
  cd analysis; uv run python n_of_1.py --phase 1 --export ../data/exports/phase1.json --out ../data/exports/phase1-days.csv
  ```
- `data/` is git-ignored.

## Test mode (phase 0, development only) for walkthroughs
Development runs phase 0 only. It needs a phase-0 schedule in `platform\data\schedules-dev\` (git-ignored):
```powershell
cd analysis; uv run python make_schedule.py --phase 0 --out ../data/schedules-dev
```
- Test mode sessions are saved in `dev` mode in `app_dev`, and study-log lines go to `platform\data\study-log-dev\`.
- To start over, reset the development database (below).

## Checks
```powershell
powershell -File scripts/check.ps1
```
This runs ruff (lint and format), pytest against the environment's test database, the Angular unit tests (Vitest), and the production build.

## Backups
```powershell
cd api; uv run python -m app.manage backup
```
Writes a `pg_dump` of the environment's database to `data/backups/` (git-ignored). Production is backed up before every release.

To restore a backup into an empty schema:
```powershell
psql -h localhost -U postgres -d <database> -f data/backups/<file>.sql
```

## Reset the development database
```powershell
cd api; uv run python -m app.manage reset-db
```
- **Refused in production.**
- Asks you to type `RESET`.
- Writes a backup first, then drops and recreates the `public` schema and migrates to the latest revision.

## Stop
- Press Ctrl+C in each terminal.
- PostgreSQL can keep running. To stop it, use `Stop-Service postgresql-x64-18` in an administrator PowerShell.

## Level-A API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness, database check and environment (`development` or `production`) |
| PUT | `/api/sessions/{id}` | Idempotent upsert. The client generates the UUID. Finished sessions accept only identical retries (409 otherwise) |
| GET | `/api/sessions?mode=&limit=` | My records, newest first |
| PATCH | `/api/sessions/{id}/follow-up` | End-of-day self-report |
| GET | `/api/n1/today` | My experiment page state, with progress (local dates) |
| PUT | `/api/n1/days/{date}` | Plan a future day |
| POST | `/api/n1/barrier` | Report a barrier (flagged late after the planned start) |
| POST | `/api/n1/reveal` | Reveal today's slot (same reveal if repeated) |
| POST | `/api/n1/study-start` | Record the study start for the latest finished session |

Writes require the `X-Client: platform-web` header, `Content-Type: application/json`, and (if sent) an allowed `Origin`. Unknown `Host` headers are rejected.
