import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { ApiService } from '../api/api.service';

/**
 * Which build is running, from /api/health: development (branch test) or production (main).
 * Null until known, or when the server can't be reached; pages then show only what is
 * released.
 */
@Injectable({ providedIn: 'root' })
export class AppEnvironment {
  readonly value = toSignal(
    inject(ApiService)
      .health()
      .pipe(
        map((h) => h.environment),
        catchError(() => of(null)),
      ),
    { initialValue: null },
  );

  /** Development-only areas and exercises are shown in the development build only. */
  showsDevelopment(): boolean {
    return this.value() === 'development';
  }
}
