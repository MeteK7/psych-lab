// Mirrors api/app/schemas.py by hand (generated types are deferred, plan §6.1).

// try: Try it (practice, never part of the experiment). dev: Test mode (phase 0).
export type Mode = 'self_use' | 'usability' | 'try' | 'dev';
export type Condition =
  | 'action_bridge'
  | 'goal_restatement'
  | 'state_reset+action_bridge'
  | 'game_only+action_bridge';
export type Status = 'in_progress' | 'completed' | 'aborted';

export interface StepSummary {
  step: string;
  content_id?: string | null;
  content_version?: string | null;
  started_at: string;
  ended_at?: string | null;
  result?: Record<string, unknown>;
}

export interface SessionUpsert {
  mode: Mode;
  condition: Condition;
  status: Status;
  content_versions?: Record<string, string>;
  steps?: StepSummary[];
  plan?: Record<string, unknown> | null;
  ratings?: Record<string, unknown> | null;
  started_at: string;
  ended_at?: string | null;
  n1_reveal_id?: string | null;
}

export interface FollowUp {
  self_reported_minutes?: number | null;
  burden?: number | null;
  note?: string | null;
}

export interface SessionOut {
  id: string;
  mode: Mode;
  condition: Condition;
  status: Status;
  content_versions: Record<string, string>;
  steps: StepSummary[];
  plan: Record<string, unknown> | null;
  ratings: Record<string, unknown> | null;
  followup: (FollowUp & { recorded_at: string }) | null;
  started_at: string;
  ended_at: string | null;
  n1_reveal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Health {
  status: 'ok';
  database: 'ok';
  environment: 'development' | 'production';
}

// Mirrors api/app/n1.py today_view().
export type N1Status =
  | 'no_plan'
  | 'pending'
  | 'revealed'
  | 'late_barrier'
  | 'session'
  | 'ineligible'
  | 'eligible_no_session';

export interface N1Today {
  phase: number;
  test_phase: boolean;
  session_mode: Mode;
  timezone: string;
  today: string;
  status: N1Status;
  plan: { planned_start: string; barrier: string | null; barrier_late: boolean | null } | null;
  reveal: {
    id: string;
    condition: Condition;
    revealed_at: string;
    minutes_after_planned: number;
    late_start: boolean;
  } | null;
  session: { id: string; status: Status } | null;
  study_start_target: { session_date: string; window_from: string } | null;
  study_start: { session_date: string; recorded_at: string } | null;
  tomorrow: string;
  tomorrow_plan: { planned_start: string } | null;
  can_start_session: boolean;
  can_report_barrier: boolean;
  barrier_would_be_late: boolean;
  /** Session days (revealed slots) and planned days so far in the current phase. */
  progress: { session_days: number; planned_days: number };
}
