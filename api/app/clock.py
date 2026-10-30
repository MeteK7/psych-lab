from datetime import UTC, datetime


def get_now() -> datetime:
    """Current time; a dependency so tests can set the clock (e.g. near midnight)."""
    return datetime.now(UTC)
