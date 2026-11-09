import { Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';

import { PageExit } from './page-exit';

/** Seconds of warning before the visit ends. */
export const IDLE_WARNING_SECONDS = 30;
const ACTIVITY = ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart'] as const;

/**
 * The booth's idle reset (M1): after a while without input, it asks whether someone is still
 * there, then ends the visit with a full load of Home, so the next visitor finds nothing of it.
 */
@Component({
  selector: 'app-idle-reset',
  template: `
    @if (left() !== null) {
      <section class="idle" role="alertdialog" aria-labelledby="idle-heading" aria-describedby="idle-text">
        <h2 id="idle-heading">Still there?</h2>
        <p id="idle-text">This visit ends in {{ left() }} seconds, and nothing from it is kept on screen.</p>
        <button type="button" #stay (click)="active()">I'm still here</button>
      </section>
    }
  `,
  styles: `
    .idle { position: fixed; inset: auto 1rem 1rem auto; max-width: 24rem; z-index: 10;
            background: var(--bg); border: 2px solid var(--accent); border-radius: 8px; padding: 1rem; }
    .idle h2 { margin-top: 0; font-size: 1.1rem; }
  `,
})
export class IdleReset {
  readonly seconds = input.required<number>();
  protected readonly left = signal<number | null>(null);
  private readonly stay = viewChild<ElementRef<HTMLButtonElement>>('stay');
  private readonly exit = inject(PageExit);
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private countdown: ReturnType<typeof setInterval> | undefined;

  constructor() {
    const onActivity = () => {
      if (this.left() === null) this.restart();
    };
    for (const event of ACTIVITY) document.addEventListener(event, onActivity, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() => {
      for (const event of ACTIVITY) document.removeEventListener(event, onActivity, { capture: true });
      this.clear();
    });
    queueMicrotask(() => this.restart());
  }

  protected active(): void {
    this.left.set(null);
    this.restart();
  }

  private restart(): void {
    this.clear();
    this.idleTimer = setTimeout(() => this.warn(), this.seconds() * 1000);
  }

  private warn(): void {
    this.left.set(IDLE_WARNING_SECONDS);
    setTimeout(() => this.stay()?.nativeElement.focus());
    this.countdown = setInterval(() => {
      const next = (this.left() ?? 0) - 1;
      if (next > 0) {
        this.left.set(next);
        return;
      }
      this.clear();
      this.exit.home();
    }, 1000);
  }

  private clear(): void {
    clearTimeout(this.idleTimer);
    clearInterval(this.countdown);
  }
}
