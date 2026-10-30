"""sessions.last_saved_at: server time of the last save while the session ran

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-31
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column(
            "last_saved_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    # Existing rows: best available approximation of their last save.
    op.execute("UPDATE sessions SET last_saved_at = COALESCE(ended_at, updated_at)")


def downgrade() -> None:
    op.drop_column("sessions", "last_saved_at")
