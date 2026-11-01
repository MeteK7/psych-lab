"""sessions.mode 'try': Try it (practice) runs, separate from Test mode ('dev')

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-01
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_sessions_mode", "sessions", type_="check")
    op.create_check_constraint(
        "ck_sessions_mode", "sessions", "mode IN ('self_use', 'usability', 'try', 'dev')"
    )
    # Until now Try it was stored as 'dev'; Test mode sessions always have a reveal.
    op.execute("UPDATE sessions SET mode = 'try' WHERE mode = 'dev' AND n1_reveal_id IS NULL")


def downgrade() -> None:
    op.execute("UPDATE sessions SET mode = 'dev' WHERE mode = 'try'")
    op.drop_constraint("ck_sessions_mode", "sessions", type_="check")
    op.create_check_constraint(
        "ck_sessions_mode", "sessions", "mode IN ('self_use', 'usability', 'dev')"
    )
