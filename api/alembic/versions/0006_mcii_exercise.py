"""sessions.condition: also allow the Try it-only MCII exercise

The experiment's conditions and every existing row are unchanged; this only widens the check
constraint. Experiment rules (reveal, mode) stay in the API (schemas.SessionUpsert).

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-06
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EXISTING = (
    "'action_bridge', 'goal_restatement', 'state_reset+action_bridge', 'game_only+action_bridge', "
    "'cs_other_readings', 'cs_why_it_happened', 'cs_not_enough_to_go_on'"
)
NEW = "'mcii'"


def upgrade() -> None:
    op.drop_constraint("ck_sessions_condition", "sessions", type_="check")
    allowed = f"condition IN ({EXISTING}, {NEW})"
    op.create_check_constraint("ck_sessions_condition", "sessions", allowed)


def downgrade() -> None:
    # Fails (rather than deleting anything) while sessions of the new exercise exist.
    op.drop_constraint("ck_sessions_condition", "sessions", type_="check")
    allowed = f"condition IN ({EXISTING})"
    op.create_check_constraint("ck_sessions_condition", "sessions", allowed)
