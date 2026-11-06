import uuid
from datetime import datetime
from typing import Any, Literal, Self, get_args

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

# try: Try it (practice, never part of the experiment). dev: Test mode (phase 0).
Mode = Literal["self_use", "usability", "try", "dev"]
# The experiment's conditions (protocol-n-of-1.md); unchanged by the exercise registry.
Condition = Literal[
    "action_bridge",
    "goal_restatement",
    "state_reset+action_bridge",
    "game_only+action_bridge",
]
# Every exercise a session can run. Exercises that aren't experiment conditions run only in
# Try it (or usability sessions), never with a reveal.
ExerciseId = Literal[
    "action_bridge",
    "goal_restatement",
    "state_reset+action_bridge",
    "game_only+action_bridge",
    "cs_other_readings",
    "cs_why_it_happened",
    "cs_not_enough_to_go_on",
    "mcii",
]
EXPERIMENT_CONDITIONS: tuple[str, ...] = get_args(Condition)
NON_EXPERIMENT_MODES = ("try", "usability")
# Saved in the development build only, until their release gates pass
# (docs/cognitive-shifts-design.md section 9, docs/mcii-design.md section 7).
DEVELOPMENT_ONLY_EXERCISES = (
    "cs_other_readings",
    "cs_why_it_happened",
    "cs_not_enough_to_go_on",
    "mcii",
)
Status = Literal["in_progress", "completed", "aborted"]


class StepSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step: str = Field(min_length=1, max_length=50)
    content_id: str | None = Field(default=None, max_length=100)
    content_version: str | None = Field(default=None, max_length=20)
    started_at: AwareDatetime
    ended_at: AwareDatetime | None = None
    result: dict[str, Any] = Field(default_factory=dict)


class SessionUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Mode
    condition: ExerciseId
    status: Status
    content_versions: dict[str, str] = Field(default_factory=dict)
    steps: list[StepSummary] = Field(default_factory=list, max_length=20)
    plan: dict[str, Any] | None = None
    ratings: dict[str, Any] | None = None
    started_at: AwareDatetime
    ended_at: AwareDatetime | None = None
    # n-of-1 sessions: the reveal that assigned the condition.
    n1_reveal_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _check(self) -> Self:
        if self.ended_at is not None and self.ended_at < self.started_at:
            raise ValueError("ended_at must not be before started_at")
        if self.status != "in_progress" and self.ended_at is None:
            raise ValueError("a finished session needs ended_at")
        if self.condition not in EXPERIMENT_CONDITIONS and (
            self.mode not in NON_EXPERIMENT_MODES or self.n1_reveal_id is not None
        ):
            raise ValueError("this exercise runs only in Try it, never in the experiment")
        return self


class FollowUp(BaseModel):
    model_config = ConfigDict(extra="forbid")

    self_reported_minutes: int | None = Field(default=None, ge=0, le=1440)
    burden: int | None = Field(default=None, ge=0, le=10)
    note: str | None = Field(default=None, max_length=500)


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mode: str
    condition: str
    status: str
    content_versions: dict[str, Any]
    steps: list[dict[str, Any]]
    plan: dict[str, Any] | None
    ratings: dict[str, Any] | None
    followup: dict[str, Any] | None
    started_at: datetime
    ended_at: datetime | None
    n1_reveal_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class Health(BaseModel):
    status: Literal["ok"]
    database: Literal["ok"]
    environment: Literal["development", "production"]
