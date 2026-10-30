"""create sessions table

Revision ID: 0001
Revises:
Create Date: 2026-10-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("mode", sa.String(length=20), nullable=False),
        sa.Column("condition", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "content_versions",
            postgresql.JSONB(),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "steps", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False
        ),
        sa.Column("plan", postgresql.JSONB(), nullable=True),
        sa.Column("ratings", postgresql.JSONB(), nullable=True),
        sa.Column("followup", postgresql.JSONB(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("mode IN ('self_use', 'usability', 'dev')", name="ck_sessions_mode"),
        sa.CheckConstraint(
            "condition IN ('action_bridge', 'goal_restatement', "
            "'state_reset+action_bridge', 'game_only+action_bridge')",
            name="ck_sessions_condition",
        ),
        sa.CheckConstraint(
            "status IN ('in_progress', 'completed', 'aborted')", name="ck_sessions_status"
        ),
        sa.CheckConstraint("ended_at IS NULL OR ended_at >= started_at", name="ck_sessions_times"),
    )
    op.create_index("ix_sessions_started_at", "sessions", ["started_at"])


def downgrade() -> None:
    op.drop_index("ix_sessions_started_at", table_name="sessions")
    op.drop_table("sessions")
