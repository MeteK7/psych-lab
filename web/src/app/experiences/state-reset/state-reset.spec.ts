import { TestBed } from '@angular/core/testing';

import { STATE_RESET } from '../../../content';
import { StateReset } from './state-reset';

describe('StateReset', () => {
  function create(variant: 'image' | 'game_only') {
    const fixture = TestBed.createComponent(StateReset);
    fixture.componentRef.setInput('variant', variant);
    return fixture;
  }

  it('asks for image ratings after the intro in the image variant', async () => {
    const fixture = create('image');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(STATE_RESET.image_variant.intro);
    root.querySelector('button')!.click();
    await fixture.whenStable();
    expect(root.querySelectorAll('fieldset')).toHaveLength(2);
  });

  it('goes straight to the timed phase in the game-only variant, with no image wording', async () => {
    const fixture = create('game_only');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toContain('picture');
    root.querySelector('button')!.click();
    await fixture.whenStable();
    expect(root.querySelector('[role="status"]')?.textContent).toContain(STATE_RESET.game_only_variant.hold);
    fixture.destroy();
  });

  it('emits stopped when the user stops', async () => {
    const fixture = create('image');
    let stopped = false;
    fixture.componentInstance.stopped.subscribe(() => (stopped = true));
    await fixture.whenStable();
    const stop = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === STATE_RESET.stop_label,
    );
    stop!.click();
    expect(stopped).toBe(true);
  });
});
