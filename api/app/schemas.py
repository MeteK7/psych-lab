import uuid
from datetime import datetime
from typing import Any, Literal, Self

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

# try: Try it (practice, never part of the experiment). dev: Test mode (phase 0).
Mode = Literal["self_use", "usability", "try", "dev"]
Condition = Literal[
    "action_bridge",
    "goal_restatement",
    "state_reset+action_bridge",
    "game_only+action_bridge",
]
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
    condition: Condition
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
    def _check_times(self) -> Self:
        if self.ended_at is not None and self.ended_at < self.started_at:
            raise ValueError("ended_at must not be before started_at")
        if self.status != "in_progress" and self.ended_at is None:
            raise ValueError("a finished session needs ended_at")
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
