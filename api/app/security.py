"""Guards for a localhost-only API.

The API has no accounts, so the risk is a website in the user's browser sending
writes to http://localhost. A required custom header forces a CORS preflight,
which this API never approves (no CORS middleware). The Origin check covers
browsers that send one, and TrustedHostMiddleware (configured in main.py)
blocks DNS-rebinding hostnames.
"""

from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
CLIENT_HEADER = "x-client"
CLIENT_VALUE = "platform-web"


class LocalWriteGuard(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, allowed_origins: list[str]) -> None:
        super().__init__(app)
        self.allowed_origins = frozenset(allowed_origins)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method in UNSAFE_METHODS:
            if request.headers.get(CLIENT_HEADER) != CLIENT_VALUE:
                return JSONResponse({"detail": "Missing or invalid client header."}, 403)
            origin = request.headers.get("origin")
            if origin is not None and origin not in self.allowed_origins:
                return JSONResponse({"detail": "Origin not allowed."}, 403)
            content_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
            if content_type != "application/json":
                return JSONResponse({"detail": "Content-Type must be application/json."}, 415)
        return await call_next(request)
