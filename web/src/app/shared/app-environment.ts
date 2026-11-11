import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { ApiService } from '../api/api.service';
import { ExerciseId, Health } from '../api/types';

/**
 * Which build is running, from /api/health: development (branch test) or production (main),
 * and which profile: this computer, or a booth (M1). Asked once per page load.
 * Null until known, or when the server can't be reached; pages then show only what is
 * released, and no booth.
 */
@Injectable({ providedIn: 'root' })
export class AppEnvironment {
  /** The health answer, shared; null if the server can't be reached. Route guards wait for it. */
  readonly health$: Observable<Health | null> = inject(ApiService)
    .health()
    .pipe(
      catchError(() => of(null)),
      shareReplay(1),
    );
  private readonly health = toSignal(this.health$, { initialValue: null });

  readonly value = computed(() => this.health()?.environment ?? null);
  /** The booth's settings, or null on this computer. */
  readonly booth = computed(() => (this.health()?.profile === 'booth' ? (this.health()?.booth ?? null) : null));

  /** Development-only areas and exercises are shown in the development build only. */
  showsDevelopment(): boolean {
    return this.value() === 'development';
  }

  /** Whether an exercise is offered here: in a booth, only those rated safe for unsupervised use. */
  offers(exercise: ExerciseId): boolean {
    const booth = this.booth();
    return !booth || booth.exercises.includes(exercise);
  }
}
