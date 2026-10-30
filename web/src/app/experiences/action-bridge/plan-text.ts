import { ActionBridgeContent, CueType } from '../../../content';

export interface ActionBridgeInput {
  goal: string;
  cueType: CueType;
  cue: string;
  firstStep: string;
  obstacle: string;
  obstacleResponse: string;
}

/** The if-then sentence shown for rehearsal and stored with the session. */
export function planText(content: ActionBridgeContent, input: ActionBridgeInput): string {
  const cue = content.cue_types.find((c) => c.value === input.cueType);
  const main = `${cue?.prefix ?? 'When'} ${input.cue.trim()}, then I will ${input.firstStep.trim()}.`;
  const obstacle = input.obstacle.trim();
  const response = input.obstacleResponse.trim();
  return obstacle && response ? `${main} If ${obstacle}, then I will ${response}.` : main;
}

/** Required fields filled; the obstacle pair is optional but must be complete if started. */
export function isPlanComplete(input: ActionBridgeInput): boolean {
  const filled = (s: string) => s.trim().length > 0;
  const obstacleOk = filled(input.obstacle) === filled(input.obstacleResponse);
  return filled(input.goal) && filled(input.cue) && filled(input.firstStep) && obstacleOk;
}
