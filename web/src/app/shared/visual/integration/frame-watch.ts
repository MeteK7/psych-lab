import { Injectable, signal } from '@angular/core';

import { FrameReport, FrameStats } from '../rendering/frame-stats';

export type { FrameReport };
export { FrameStats };

export interface WatchedFigure {
  /** What the figure draws (its scene or composition id), read when the overlay shows it. */
  label: () => string;
  backend: 'svg' | 'canvas';
  stats: FrameStats;
}

/**
 * S9 Integration: every figure on the page that the watchdog follows (milestone M6), for the Visual
 * Lab's performance overlay. Figures add themselves while they're on the page; the overlay reads
 * their reports. Nothing is recorded with a session.
 */
@Injectable({ providedIn: 'root' })
export class FrameWatch {
  private readonly list = signal<readonly WatchedFigure[]>([]);
  readonly figures = this.list.asReadonly();

  /** Follows a figure; the function it gives back stops following it. */
  watch(figure: WatchedFigure): () => void {
    this.list.update((l) => [...l, figure]);
    return () => this.list.update((l) => l.filter((f) => f !== figure));
  }
}
