from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# platform/api/app/config.py -> platform/ (holds .env) -> project root (holds study-log/).
PLATFORM_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = PLATFORM_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # repr=False keeps passwords out of logs, tracebacks and test output.
    database_url: str = Field(repr=False)
    test_database_url: str | None = Field(default=None, repr=False)
    # Comma-separated lists, kept as strings so .env stays readable.
    allowed_hosts: str = "localhost,127.0.0.1"
    allowed_origins: str = "http://localhost:4300"

    # n-of-1 (protocol-n-of-1.md). Phase 0 is a test phase that is never analysed.
    n1_phase: int = 1
    n1_schedule_dir: Path = PLATFORM_DIR / "analysis" / "schedules"
    n1_study_log_dir: Path = PLATFORM_DIR.parent / "study-log"
    # All n-of-1 dates and day boundaries use this local time zone, not UTC.
    study_timezone: str = "Europe/Istanbul"

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @property
    def allowed_origin_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
