import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, signal, viewChild } from '@angular/core';

import { STATE_RESET_SOUND, fill } from '../../../content';
import { playTone } from './tone-audio';
import { ToneRound, ToneSetResult } from './tones';

// Frames longer than this (e.g. a hidden tab) count only up to the cap, as in the dot game.
const MAX_FRAME_MS = 100;

/**
 * One timed set of the sound game: the non-visual alternative to the dot game. Respond to
 * each high tone with Space (the game area has focus) or the "High tone" button.
 */
@Component({
  selector: 'app-tone-game',
  template: `
    <div #area class="area" tabindex="0" role="application" aria-roledescription="sound game"
         [attr.aria-label]="label()" (keydown)="onKeyDown($event)">
      <button type="button" class="respond" (click)="respond()">{{ content.how_it_works.respond }}</button>
    </div>
    <p class="timer" aria-live="off">{{ remaining() }} s</p>
  `,
  styles: `
    .area { display: grid; place-items: center; max-width: 480px; aspect-ratio: 3 / 1;
            border: 1px solid var(--border); border-radius: 8px; }
    .respond { font-size: 1.15rem; padding: 0.75rem 1.5rem; }
    .timer { color: var(--muted); margin: 0.25rem 0 0; font-variant-numeric: tabular-nums; }
  `,
})
export class ToneGame implements AfterViewInit, OnDestroy {
  readonly seconds = input.required<number>();
  readonly finished = output<ToneSetResult>();

  protected readonly content = STATE_RESET_SOUND;
  protected readonly remaining = signal(0);
  protected readonly label = signal('');

  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  private readonly round = new ToneRound(STATE_RESET_SOUND.tones);
  private elapsedMs = 0;
  private lastFrame: number | null = null;
  private frameHandle: number | null = null;
  private done = false;

  ngAfterViewInit(): void {
    this.setRemaining(this.seconds());
    this.area().nativeElement.focus({ preventScroll: true });
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  ngOnDestroy(): void {
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    // The button handles its own Space and Enter; the area handles Space everywhere else.
    if (event.target !== this.area().nativeElement || (event.key !== ' ' && event.key !== 'Spacebar')) return;
    event.preventDefault();
    if (!event.repeat) this.respond();
  }

  protected respond(): void {
    if (!this.done) this.round.respond();
  }

  private frame(now: number): void {
    if (this.done) return;
    const dt = this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, MAX_FRAME_MS);
    this.lastFrame = now;
    this.elapsedMs += dt;

    const pitch = this.round.tick(this.elapsedMs);
    if (pitch) playTone(pitch, this.content.tones);

    const left = Math.max(0, Math.ceil(this.seconds() - this.elapsedMs / 1000));
    if (left !== this.remaining()) this.setRemaining(left);

    if (this.elapsedMs >= this.seconds() * 1000) {
      this.done = true;
      this.finished.emit(this.round.finish(this.elapsedMs));
      return;
    }
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  private setRemaining(seconds: number): void {
    this.remaining.set(seconds);
    this.label.set(fill(this.content.how_it_works.game_label, { seconds }));
  }
}
