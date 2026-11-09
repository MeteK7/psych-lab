from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.booth import not_in_booth
from app.config import Settings, environment_problems, get_settings
from app.routes import health, n1, sessions
from app.security import LocalWriteGuard


class UnsafeEnvironmentError(RuntimeError):
    """The settings would let one environment touch the other's data."""


def check_environment(settings: Settings) -> None:
    problems = environment_problems(settings)
    if problems:
        lines = "\n".join(f"  - {p}" for p in problems)
        raise UnsafeEnvironmentError(
            f"Refusing to start ({settings.app_env}); fix .env, see docs/runbook.md:\n{lines}"
        )


def serve_web(app: FastAPI, dist: Path) -> None:
    """Serve the built web app; page addresses (e.g. /experiment) fall back to index.html."""
    root = dist.resolve()

    @app.get("/{path:path}", include_in_schema=False)
    def web(path: str) -> FileResponse:
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found.")
        file = (root / path).resolve()
        if path and file.is_file() and file.is_relative_to(root):
            return FileResponse(file)
        return FileResponse(root / "index.html")


def create_app(settings: Settings | None = None, *, enforce_environment: bool = False) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        # Checked when the server starts, so tests can build apps with any settings.
        if enforce_environment:
            check_environment(settings)
        yield

    app = FastAPI(
        title="Interactive experiences API (local)",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(LocalWriteGuard, allowed_origins=settings.allowed_origin_list)
    # Added last, so it runs first: reject unknown Host headers before anything else.
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)
    app.include_router(health.router, prefix="/api")
    app.include_router(sessions.router, prefix="/api")
    # The experiment never runs in the booth (M1).
    app.include_router(n1.router, prefix="/api", dependencies=[Depends(not_in_booth)])
    if settings.app_env == "production":
        # Registered last, so every /api route matches first.
        serve_web(app, settings.web_dist_dir)
    return app


app = create_app(enforce_environment=True)
