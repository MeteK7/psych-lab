import { TestBed } from '@angular/core/testing';

import { StepOutcome } from '../../flow/step-outcome';
import { ActionBridge } from './action-bridge';

describe('ActionBridge', () => {
  it('collects an if-then plan, asks for rehearsal, then emits it', async () => {
    const fixture = TestBed.createComponent(ActionBridge);
    const emitted: StepOutcome[] = [];
    fixture.componentInstance.completed.subscribe((o) => emitted.push(o));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const buttons = () => Array.from(root.querySelectorAll('button'));
    const continueButton = () => buttons().find((b) => b.textContent?.trim() === 'Continue')!;

    const [goal, cue, firstStep] = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="text"]'));
    expect(continueButton().disabled).toBe(true);
    for (const [input, value] of [
      [goal, 'backpropagation'],
      [cue, '19:00'],
      [firstStep, 'read the first worked example'],
    ] as const) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
    continueButton().click();
    await fixture.whenStable();

    expect(root.querySelector('blockquote')?.textContent?.trim()).toBe(
      'When it is 19:00, then I will read the first worked example.',
    );
    expect(continueButton().disabled).toBe(true);
    root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await fixture.whenStable();
    continueButton().click();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].plan).toMatchObject({
      type: 'action_bridge',
      cue_type: 'time',
      cue: '19:00',
      first_step: 'read the first worked example',
      obstacle: null,
      rehearsed: true,
    });
  });
});
