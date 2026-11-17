"""sessions.condition: also allow the Try it-only "Change the camera angle" exercise

The experiment's conditions and every existing row are unchanged; this only widens the check
constraint. Experiment rules (reveal, mode) stay in the API (schemas.SessionUpsert).

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-16
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EXISTING = (
    "'action_bridge', 'goal_restatement', 'state_reset+action_bridge', 'game_only+action_bridge', "
    "'cs_other_readings', 'cs_why_it_happened', 'cs_not_enough_to_go_on', 'mcii'"
)
NEW = "'cs_camera_angle'"


def upgrade() -> None:
    op.drop_constraint("ck_sessions_condition", "sessions", type_="check")
    allowed = f"condition IN ({EXISTING}, {NEW})"
    op.create_check_constraint("ck_sessions_condition", "sessions", allowed)


def downgrade() -> None:
    # Fails (rather than deleting anything) while sessions of the new exercise exist.
    op.drop_constraint("ck_sessions_condition", "sessions", type_="check")
    allowed = f"condition IN ({EXISTING})"
    op.create_check_constraint("ck_sessions_condition", "sessions", allowed)
