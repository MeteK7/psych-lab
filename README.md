# The platform

A browser-based platform of purposeful, interactive experiences informed by psychology, cognitive science and behavioural science. It is **not a therapy service** and makes no clinical claims. Everything runs locally on this computer.

- What the platform is and how it will be used: [docs/product-model.md](docs/product-model.md)
- The research-led plan and its decisions: [docs/plan.md](docs/plan.md)
- The full operating guide (environments, releases, backups, the study): [docs/runbook.md](docs/runbook.md)

## Repository layout

| Folder | What it holds |
|---|---|
| `api/` | The API: FastAPI, SQLAlchemy and Alembic migrations on PostgreSQL, managed with uv |
| `web/` | The web app: Angular, with Vitest unit tests and Playwright browser tests |
| `analysis/` | n-of-1 scripts: schedules (`make_schedule.py`) and analysis (`n_of_1.py`) |
| `scripts/` | `check.ps1`, which runs every check |
| `docs/` | Plan, designs, reviews, protocol and the runbook |
| `data/` | Local data: dev study log, backups, exports (git-ignored) |

## Environments

There are two, and each has its own folder, branch, databases and ports:

| | Development | Production |
|---|---|---|
| Folder and branch | `platform\`, `test` | `platform-prod\`, `main` |
| Databases | `app_dev`, tests `app_test` | `app_prod`, tests `app_test_main` |
| Address | http://localhost:4310 (API on 8110) | http://localhost:4300 (one process serves the app and the API) |

The server refuses to start if one environment's settings point at the other's data, and it says what to fix. This README covers **development**. For production, see [docs/runbook.md](docs/runbook.md).

## Prerequisites (one time)

| Tool | Check |
|---|---|
| PostgreSQL 18, Windows service `postgresql-x64-18`, on `localhost:5432` | `Get-Service postgresql-x64-18` |
| `psql` and `pg_dump` on PATH (`C:\Program Files\PostgreSQL\18\bin`) | `psql --version; pg_dump --version` |
| uv with Python 3.13 | `uv --version; uv python list --only-installed` |
| Node.js LTS (v24 is in use) | `node --version; npm --version` |

If uv has no Python 3.13, install it with `uv python install 3.13`.

**If npm is blocked by NVM** (`NVM blocked package-manager execution … Event code: NVM4306`), NVM no longer trusts that Node install. If you trust it, run `nvm reshim`. Otherwise reinstall that version (`nvm uninstall <version>`, then `nvm install <version>`). If the change was unexpected, check the NVM event logs first.

## One-time setup (development)

Run every command from `C:\Projects\new_project\platform`.

1. **Databases.** Open `psql -U postgres -h localhost` and create the two databases (skip any that already exist):
   ```sql
   CREATE DATABASE app_dev;
   CREATE DATABASE app_test;
   ```
2. **`.env`.** Copy the development block of [.env.example](.env.example) to `.env` (git-ignored) and fill in the postgres password. Percent-encode special characters in the password, for example `@` becomes `%40`. The development values are `APP_ENV=development`, `N1_PHASE=0` and `ALLOWED_ORIGINS=http://localhost:4310`.
3. **Install the API and migrate the database:**
   ```powershell
   cd api; uv sync; uv run alembic upgrade head
   ```
4. **Install the web app:**
   ```powershell
   cd web; npm ci
   ```

## Run locally

Use two terminals, both starting in `platform\`. Start the API first.

**Terminal 1, the API** (http://127.0.0.1:8110):
```powershell
cd api; uv run fastapi dev app/main.py --host 127.0.0.1 --port 8110 --reload-dir app
```

**Terminal 2, the web app** (http://localhost:4310):
```powershell
cd web; npm start
```

Open **http://localhost:4310**. A **Development** badge in the header confirms you are on the development build.

- The web dev server proxies `/api` to the API (`web/proxy.conf.json`), so the browser sees a single origin.
- API docs: http://localhost:4310/api/docs. Health check: http://localhost:4310/api/health.
- Keep `--reload-dir app`. Without it, the reloader also watches `api/.venv` and keeps restarting the API.
- If a port is taken, find what owns it:
  ```powershell
  Get-NetTCPConnection -State Listen -LocalPort 4310,8110
  ```
- **Stop:** press Ctrl+C in each terminal. PostgreSQL can keep running.

## Checks

Run every check (ruff, pytest, the Angular unit tests, the production build, and the browser and booth browser tests):
```powershell
powershell -File scripts/check.ps1
```

To run only the browser tests:
```powershell
cd web; npm run e2e
```

- The browser tests use the installed Microsoft Edge and start their own API and web app on ports 8120 and 4320. The booth tests use 8130 and 4330. The development app on 4310/8110 can keep running.
- They reset and use the **test database** (`TEST_DATABASE_URL`), and refuse to run against `app_dev` or `app_prod`.
- Snapshots of failed tests are written to `web/test-results/`.

## Common tasks

Reset the development database. You type `RESET` to confirm; a backup is written first. Refused in production.
```powershell
cd api; uv run python -m app.manage reset-db
```

Back up the environment's database to `data/backups/`:
```powershell
cd api; uv run python -m app.manage backup
```

Starting production, releasing, the booth profile, usability sessions and the n-of-1 export are all in [docs/runbook.md](docs/runbook.md).
