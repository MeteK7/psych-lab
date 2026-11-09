import { ComponentFixture, TestBed } from '@angular/core/testing';

import { STATE_RESET, STATE_RESET_SOUND } from '../../../content';
import { StepOutcome } from '../../flow/step-outcome';
import { StateReset } from './state-reset';

describe('StateReset', () => {
  function create(variant: 'image' | 'game_only', assigned = false) {
    const fixture = TestBed.createComponent(StateReset);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('assigned', assigned);
    return fixture;
  }

  const root = (f: ComponentFixture<StateReset>) => f.nativeElement as HTMLElement;

  function click(f: ComponentFixture<StateReset>, text: string): void {
    const button = Array.from(root(f).querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
    if (!button) throw new Error(`No button "${text}"`);
    button.click();
  }

  async function choosePicture(f: ComponentFixture<StateReset>, picture: string): Promise<void> {
    await f.whenStable();
    click(f, STATE_RESET.next_label); // about this exercise
    await f.whenStable();
    const input = root(f).querySelector<HTMLInputElement>('input[type="text"]')!;
    input.value = picture;
    input.dispatchEvent(new Event('input'));
    await f.whenStable();
    click(f, STATE_RESET.next_label);
    await f.whenStable();
  }

  async function rateBoth(f: ComponentFixture<StateReset>, label: string): Promise<void> {
    for (const fieldset of Array.from(root(f).querySelectorAll('fieldset'))) {
      fieldset.querySelector<HTMLInputElement>('input[value="5"]')!.click();
    }
    await f.whenStable();
    click(f, label);
    await f.whenStable();
  }

  it('explains the exercise before anything else', async () => {
    const fixture = create('image');
    await fixture.whenStable();
    const text = root(fixture).textContent!;
    expect(text).toContain(STATE_RESET.image_variant.about_intro);
    for (const part of STATE_RESET.image_variant.about_parts) expect(text).toContain(part);
  });

  it('asks for the picture in its own step, then quotes it back', async () => {
    const fixture = create('image');
    await fixture.whenStable();
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    const text = root(fixture).textContent!;
    expect(text).toContain(STATE_RESET.picture.invitation);
    expect(text).toContain(STATE_RESET.picture.safety);
    expect(text).not.toContain(STATE_RESET.picture.experiment_note); // practice: no experiment note
    const next = Array.from(root(fixture).querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === STATE_RESET.next_label,
    );
    expect(next?.disabled).toBe(true); // the picture must be described first

    const run = create('image');
    await choosePicture(run, 'opening chapter 3');
    expect(root(run).textContent).toContain('Your picture: “opening chapter 3”');
    expect(root(run).querySelectorAll('fieldset')).toHaveLength(2);
  });

  it('adds the experiment note only when the experiment assigned the exercise', async () => {
    const fixture = create('image', true);
    await fixture.whenStable();
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    expect(root(fixture).textContent).toContain(STATE_RESET.picture.experiment_note);
  });

  it('shows a labelled preview before the practice round', async () => {
    const fixture = create('image');
    await choosePicture(fixture, 'opening chapter 3');
    await rateBoth(fixture, STATE_RESET.next_label);

    const text = root(fixture).textContent!;
    expect(text).toContain(STATE_RESET.how_it_works.heading);
    expect(root(fixture).querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe(
      STATE_RESET.how_it_works.illustration_alt,
    );
    expect(text).toContain(STATE_RESET.how_it_works.labels.ring);
    expect(root(fixture).querySelector('canvas')).toBeNull(); // nothing moves until practice starts
    click(fixture, STATE_RESET.how_it_works.start_practice);
    await fixture.whenStable();
    expect(root(fixture).querySelector('canvas')).not.toBeNull();
    fixture.destroy();
  });

  it('never includes the picture description in what it emits', async () => {
    const fixture = create('image');
    let outcome: StepOutcome | null = null;
    fixture.componentInstance.completed.subscribe((o) => (outcome = o));
    await choosePicture(fixture, 'my private words');
    await rateBoth(fixture, STATE_RESET.next_label);
    // Finish directly: the timed rounds themselves are covered by the schedule tests.
    (fixture.componentInstance as unknown as { finish(): void }).finish();
    expect(outcome).not.toBeNull();
    expect(JSON.stringify(outcome)).not.toContain('my private words');
    expect(outcome!.ratings).toEqual({ image_vividness_pre: 5, image_emotionality_pre: 5 });
    fixture.destroy();
  });

  it('goes from the intro to the practice step in the game-only variant, with no picture wording', async () => {
    const fixture = create('game_only');
    await fixture.whenStable();
    expect(root(fixture).textContent).not.toContain('picture');
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    expect(root(fixture).textContent).toContain(STATE_RESET.how_it_works.heading);
    expect(root(fixture).textContent).toContain(STATE_RESET.game_only_variant.practice);
    expect(root(fixture).textContent).not.toContain('picture');
    fixture.destroy();
  });

  it('offers the sound version before practice, and switches the game to tones', async () => {
    const fixture = create('game_only');
    let outcome: StepOutcome | null = null;
    fixture.componentInstance.completed.subscribe((o) => (outcome = o));
    await fixture.whenStable();
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    expect(root(fixture).textContent).toContain(STATE_RESET_SOUND.offer.note);

    click(fixture, STATE_RESET_SOUND.offer.use_sound);
    await fixture.whenStable();
    expect(root(fixture).textContent).toContain(STATE_RESET_SOUND.how_it_works.heading);
    expect(root(fixture).querySelector('app-game-preview')).toBeNull();
    click(fixture, STATE_RESET.how_it_works.start_practice);
    await fixture.whenStable();
    expect(root(fixture).querySelector('app-tone-game')).not.toBeNull();
    expect(root(fixture).querySelector('canvas')).toBeNull();

    (fixture.componentInstance as unknown as { finish(): void }).finish();
    expect(outcome!.result['task']).toBe('sound');
    fixture.destroy();
  });

  it('can switch back to the dot game before practice', async () => {
    const fixture = create('game_only');
    await fixture.whenStable();
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    click(fixture, STATE_RESET_SOUND.offer.use_sound);
    await fixture.whenStable();
    click(fixture, STATE_RESET_SOUND.offer.use_dot);
    await fixture.whenStable();
    expect(root(fixture).querySelector('app-game-preview')).not.toBeNull();
    fixture.destroy();
  });

  it('never offers the sound version in an experiment exercise', async () => {
    const fixture = create('game_only', true);
    await fixture.whenStable();
    click(fixture, STATE_RESET.next_label);
    await fixture.whenStable();
    expect(root(fixture).textContent).not.toContain(STATE_RESET_SOUND.offer.use_sound);
    fixture.destroy();
  });

  it('records the dot game as the task by default', async () => {
    const fixture = create('game_only');
    let outcome: StepOutcome | null = null;
    fixture.componentInstance.completed.subscribe((o) => (outcome = o));
    await fixture.whenStable();
    (fixture.componentInstance as unknown as { finish(): void }).finish();
    expect(outcome!.result['task']).toBe('dot');
    fixture.destroy();
  });

  // Was checked in the browser through the saved Try it record, which keeps no game data since M1.
  it('records half speed when reduced motion is on, and full speed otherwise', async () => {
    for (const [reduce, speed] of [
      [true, STATE_RESET.game.reduced_motion_speed],
      [false, STATE_RESET.game.speed],
    ] as const) {
      vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }) as MediaQueryList);
      const fixture = create('game_only');
      let outcome: StepOutcome | null = null;
      fixture.componentInstance.completed.subscribe((o) => (outcome = o));
      await fixture.whenStable();
      (fixture.componentInstance as unknown as { finish(): void }).finish();
      expect(outcome!.result['speed'], `reduced motion ${reduce}`).toBe(speed);
      fixture.destroy();
      vi.unstubAllGlobals();
    }
    expect(STATE_RESET.game.reduced_motion_speed).toBe(0.5);
  });

  it('emits stopped when the user stops', async () => {
    const fixture = create('image');
    let stopped = false;
    fixture.componentInstance.stopped.subscribe(() => (stopped = true));
    await fixture.whenStable();
    click(fixture, STATE_RESET.stop_label);
    expect(stopped).toBe(true);
  });
});
