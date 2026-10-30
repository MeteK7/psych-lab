import { ACTION_BRIDGE } from '../../../content';
import { ActionBridgeInput, isPlanComplete, planText } from './plan-text';

const base: ActionBridgeInput = {
  goal: 'backpropagation',
  cueType: 'after_event',
  cue: 'finish dinner',
  firstStep: 'open the lecture notes',
  obstacle: '',
  obstacleResponse: '',
};

describe('Action Bridge plan text', () => {
  it('builds the if-then sentence from the cue type', () => {
    expect(planText(ACTION_BRIDGE, base)).toBe('After I finish dinner, then I will open the lecture notes.');
  });

  it('appends the obstacle plan when both parts are given', () => {
    const text = planText(ACTION_BRIDGE, {
      ...base,
      obstacle: 'I want to check my phone',
      obstacleResponse: 'put it in another room',
    });
    expect(text).toBe(
      'After I finish dinner, then I will open the lecture notes. ' +
        'If I want to check my phone, then I will put it in another room.',
    );
  });

  it('requires goal, cue and first step', () => {
    expect(isPlanComplete(base)).toBe(true);
    expect(isPlanComplete({ ...base, cue: '  ' })).toBe(false);
  });

  it('requires the obstacle pair to be complete once started', () => {
    expect(isPlanComplete({ ...base, obstacle: 'tired' })).toBe(false);
    expect(isPlanComplete({ ...base, obstacle: 'tired', obstacleResponse: 'do 5 minutes' })).toBe(true);
  });
});
