from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import make_url

# platform/api/app/config.py -> platform/ (holds .env) -> project root (holds study-log/).
PLATFORM_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = PLATFORM_DIR / ".env"

# Production (the main build, which runs the n-of-1) owns these; development never touches them.
PRODUCTION_DATABASE = "app_prod"
PRODUCTION_SCHEDULE_DIR = PLATFORM_DIR / "analysis" / "schedules"
PRODUCTION_STUDY_LOG_DIR = PLATFORM_DIR.parent / "study-log"
# Development's Test mode (phase 0) keeps its schedule and study log in git-ignored data/.
DEVELOPMENT_SCHEDULE_DIR = PLATFORM_DIR / "data" / "schedules-dev"
DEVELOPMENT_STUDY_LOG_DIR = PLATFORM_DIR / "data" / "study-log-dev"

Environment = Literal["development", "production"]
# standard: this computer. booth: a Try it deployment for visitors (docs/product-model.md §6).
Profile = Literal["standard", "booth"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # development: branch test, Test mode only. production: main, runs the n-of-1.
    app_env: Environment = "development"
    # repr=False keeps passwords out of logs, tracebacks and test output.
    database_url: str = Field(repr=False)
    test_database_url: str | None = Field(default=None, repr=False)
    # Comma-separated lists, kept as strings so .env stays readable.
    allowed_hosts: str = "localhost,127.0.0.1"
    allowed_origins: str = "http://localhost:4310"

    # n-of-1 (protocol-n-of-1.md). Phase 0 is a test phase that is never analysed.
    # Unset values take the environment's defaults (see _environment_defaults).
    n1_phase: int = 0
    n1_schedule_dir: Path = DEVELOPMENT_SCHEDULE_DIR
    n1_study_log_dir: Path = DEVELOPMENT_STUDY_LOG_DIR
    # All n-of-1 dates and day boundaries use this local time zone, not UTC.
    study_timezone: str = "Europe/Istanbul"
    # The booth profile (M1): Try it only, rated exercises only, no records, an idle reset, and a
    # support line on screen. The support line is set by the operator; a booth refuses to start
    # without one.
    app_profile: Profile = "standard"
    booth_idle_seconds: int = Field(default=180, ge=30, le=3600)
    booth_support_line: str = ""
    # Production serves the built web app itself (no dev server).
    web_dist_dir: Path = PLATFORM_DIR / "web" / "dist" / "web" / "browser"

    @model_validator(mode="after")
    def _environment_defaults(self) -> Self:
        if self.app_env == "production":
            unset = {
                "n1_phase": 1,
                "n1_schedule_dir": PRODUCTION_SCHEDULE_DIR,
                "n1_study_log_dir": PRODUCTION_STUDY_LOG_DIR,
                "allowed_origins": "http://localhost:4300",
            }
            for name, value in unset.items():
                if name not in self.model_fields_set:
                    setattr(self, name, value)
        return self

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @property
    def allowed_origin_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


def _same_dir(a: Path, b: Path) -> bool:
    return Path(a).resolve() == Path(b).resolve()


def environment_problems(settings: Settings) -> list[str]:
    """Why these settings could let one environment touch the other's data; empty if none."""
    database = make_url(settings.database_url).database
    test_database = (
        make_url(settings.test_database_url).database if settings.test_database_url else None
    )
    problems: list[str] = []
    if settings.app_env == "production":
        if database != PRODUCTION_DATABASE:
            problems.append(f"production must use the database {PRODUCTION_DATABASE}")
        if settings.n1_phase < 1:
            problems.append("production runs the experiment: N1_PHASE must be 1 or 2")
        if not _same_dir(settings.n1_schedule_dir, PRODUCTION_SCHEDULE_DIR):
            problems.append(f"production reads schedules only from {PRODUCTION_SCHEDULE_DIR}")
        if not _same_dir(settings.n1_study_log_dir, PRODUCTION_STUDY_LOG_DIR):
            problems.append(f"production writes the study log only to {PRODUCTION_STUDY_LOG_DIR}")
        if not (Path(settings.web_dist_dir) / "index.html").is_file():
            problems.append("the web app isn't built: run 'npm run build' in web/")
    else:
        if database == PRODUCTION_DATABASE:
            problems.append(f"development must not use the production database {database}")
        if settings.n1_phase != 0:
            problems.append("development runs Test mode only: set N1_PHASE=0 (or remove it)")
        if _same_dir(settings.n1_study_log_dir, PRODUCTION_STUDY_LOG_DIR):
            problems.append("development must not write to the experiment's study log")
    if settings.app_profile == "booth" and not settings.booth_support_line.strip():
        problems.append("a booth shows a local support line: set BOOTH_SUPPORT_LINE")
    if test_database == PRODUCTION_DATABASE:
        problems.append(f"TEST_DATABASE_URL must not point to {PRODUCTION_DATABASE}")
    return problems


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
