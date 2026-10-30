"""n-of-1 daily records: planned days, reveals, study starts

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "n1_days",
        sa.Column("phase", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("planned_start", sa.Time(), nullable=False),
        sa.Column("planned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("barrier", sa.Text(), nullable=True),
        sa.Column("barrier_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("barrier_late", sa.Boolean(), nullable=True),
    )
    op.create_table(
        "n1_reveals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phase", sa.Integer(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("condition", sa.String(length=50), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("revealed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("minutes_after_planned", sa.Integer(), nullable=False),
        sa.UniqueConstraint("phase", "slot", name="uq_n1_reveals_phase_slot"),
        sa.UniqueConstraint("phase", "session_date", name="uq_n1_reveals_phase_date"),
    )
    op.create_table(
        "n1_study_starts",
        sa.Column("phase", sa.Integer(), primary_key=True),
        sa.Column("session_date", sa.Date(), primary_key=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
    )
    op.add_column(
        "sessions", sa.Column("n1_reveal_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        "sessions_n1_reveal_id_fkey", "sessions", "n1_reveals", ["n1_reveal_id"], ["id"]
    )
    op.create_unique_constraint("sessions_n1_reveal_id_key", "sessions", ["n1_reveal_id"])


def downgrade() -> None:
    op.drop_constraint("sessions_n1_reveal_id_key", "sessions", type_="unique")
    op.drop_constraint("sessions_n1_reveal_id_fkey", "sessions", type_="foreignkey")
    op.drop_column("sessions", "n1_reveal_id")
    op.drop_table("n1_study_starts")
    op.drop_table("n1_reveals")
    op.drop_table("n1_days")
