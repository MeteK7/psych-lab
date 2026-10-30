from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import Settings, get_settings
from app.routes import health, n1, sessions
from app.security import LocalWriteGuard


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Interactive experiences API (local)",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )
    app.add_middleware(LocalWriteGuard, allowed_origins=settings.allowed_origin_list)
    # Added last, so it runs first: reject unknown Host headers before anything else.
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)
    app.include_router(health.router, prefix="/api")
    app.include_router(sessions.router, prefix="/api")
    app.include_router(n1.router, prefix="/api")
    return app


app = create_app()
