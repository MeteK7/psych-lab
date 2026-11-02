"""Development and production stay apart (plan §6.1, runbook "Environments")."""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app import manage
from app.config import (
    PRODUCTION_SCHEDULE_DIR,
    PRODUCTION_STUDY_LOG_DIR,
    Settings,
    environment_problems,
)
from app.main import UnsafeEnvironmentError, create_app
from app.security import CLIENT_HEADER, CLIENT_VALUE

DB = "postgresql+psycopg://postgres:secret@localhost:5432/"


def make(app_env: str, database: str, tmp_path: Path, **values: Any) -> Settings:
    # _env_file=None: only the values given here, never the local .env.
    return Settings(
        _env_file=None,  # type: ignore[call-arg]
        app_env=app_env,  # type: ignore[arg-type]
        database_url=DB + database,
        test_database_url=DB + values.pop("test_database", "app_test"),
        **values,
    )


def built_web(tmp_path: Path) -> Path:
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<html>app</html>", encoding="utf-8")
    (dist / "assets" / "main.js").write_text("console.log(1)", encoding="utf-8")
    return dist


def test_production_defaults_to_the_experiment_settings(tmp_path: Path) -> None:
    settings = make("production", "app_prod", tmp_path, web_dist_dir=built_web(tmp_path))
    assert settings.n1_phase == 1
    assert settings.n1_schedule_dir == PRODUCTION_SCHEDULE_DIR
    assert settings.n1_study_log_dir == PRODUCTION_STUDY_LOG_DIR
    assert settings.allowed_origin_list == ["http://localhost:4300"]
    assert environment_problems(settings) == []


def test_development_defaults_to_test_mode_away_from_the_experiment(tmp_path: Path) -> None:
    settings = make("development", "app_dev", tmp_path)
    assert settings.n1_phase == 0
    assert settings.n1_study_log_dir != PRODUCTION_STUDY_LOG_DIR
    assert settings.allowed_origin_list == ["http://localhost:4310"]
    assert environment_problems(settings) == []


@pytest.mark.parametrize(
    "app_env, database, values, problem",
    [
        ("development", "app_prod", {}, "must not use the production database"),
        ("development", "app_dev", {"n1_phase": 1}, "Test mode only"),
        (
            "development",
            "app_dev",
            {"n1_study_log_dir": PRODUCTION_STUDY_LOG_DIR},
            "must not write to the experiment's study log",
        ),
        ("development", "app_dev", {"test_database": "app_prod"}, "must not point to app_prod"),
        ("production", "app_dev", {}, "must use the database app_prod"),
        ("production", "app_prod", {"n1_phase": 0}, "N1_PHASE must be 1 or 2"),
        ("production", "app_prod", {"n1_schedule_dir": Path("elsewhere")}, "schedules only"),
        ("production", "app_prod", {"n1_study_log_dir": Path("elsewhere")}, "study log only"),
    ],
)
def test_settings_that_cross_environments_are_refused(
    tmp_path: Path, app_env: str, database: str, values: dict[str, Any], problem: str
) -> None:
    settings = make(app_env, database, tmp_path, web_dist_dir=built_web(tmp_path), **values)
    assert any(problem in p for p in environment_problems(settings)), environment_problems(settings)


def test_production_needs_a_built_web_app(tmp_path: Path) -> None:
    settings = make("production", "app_prod", tmp_path, web_dist_dir=tmp_path / "missing")
    assert environment_problems(settings) == [
        "the web app isn't built: run 'npm run build' in web/"
    ]


def test_the_server_refuses_to_start_with_unsafe_settings(tmp_path: Path) -> None:
    settings = make("development", "app_prod", tmp_path)
    app = create_app(settings, enforce_environment=True)
    with (
        pytest.raises(UnsafeEnvironmentError, match="production database"),
        TestClient(app, base_url="http://localhost"),
    ):
        pass


def test_production_serves_the_built_web_app(tmp_path: Path) -> None:
    settings = make("production", "app_prod", tmp_path, web_dist_dir=built_web(tmp_path))
    app = create_app(settings)
    with TestClient(
        app, base_url="http://localhost", headers={CLIENT_HEADER: CLIENT_VALUE}
    ) as client:
        assert client.get("/").text == "<html>app</html>"
        assert client.get("/experiment").text == "<html>app</html>"  # page address
        assert client.get("/assets/main.js").text == "console.log(1)"
        assert client.get("/../config.py").text == "<html>app</html>"  # never outside dist
        assert client.get("/api/unknown").status_code == 404
        assert client.get("/api/docs").status_code == 200


def test_development_serves_no_web_app(tmp_path: Path) -> None:
    app = create_app(make("development", "app_dev", tmp_path))
    with TestClient(app, base_url="http://localhost") as client:
        assert client.get("/experiment").status_code == 404


def test_reset_db_is_refused_in_production(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    settings = make("production", "app_prod", tmp_path, web_dist_dir=built_web(tmp_path))
    monkeypatch.setattr(manage, "get_settings", lambda: settings)
    monkeypatch.setattr(manage, "backup", lambda url: pytest.fail("must not back up or reset"))
    with pytest.raises(SystemExit, match="refused in production"):
        manage.reset_db(assume_yes=True)


def test_browser_tests_always_run_on_the_test_database(tmp_path: Path) -> None:
    from app.e2e_server import e2e_environment

    settings = make("development", "app_dev", tmp_path)
    env = e2e_environment(settings, tmp_path, "http://localhost:4320")
    assert env["DATABASE_URL"].endswith("/app_test")
    assert (env["APP_ENV"], env["N1_PHASE"]) == ("development", "0")
    assert env["N1_STUDY_LOG_DIR"].startswith(str(tmp_path))
    assert env["ALLOWED_ORIGINS"] == "http://localhost:4320"


@pytest.mark.parametrize("test_database", ["app_dev", "app_prod"])
def test_browser_tests_refuse_a_real_database(tmp_path: Path, test_database: str) -> None:
    from app.e2e_server import e2e_environment

    settings = make("development", "app_dev", tmp_path, test_database=test_database)
    with pytest.raises(SystemExit, match="separate test database"):
        e2e_environment(settings, tmp_path, "http://localhost:4320")
