import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ApiService } from '../../api/api.service';
import { Condition } from '../../api/types';
import { CONDITIONS } from '../../flow/conditions';

type ApiStatus = 'checking' | 'ok' | 'unavailable';

const STATUS_TEXT: Record<ApiStatus, string> = {
  checking: 'Checking…',
  ok: 'Connected; the database is reachable.',
  unavailable: 'Not reachable. Is the API running on 127.0.0.1:8100?',
};

@Component({
  selector: 'app-start-page',
  // The development page: any condition, always "dev" mode.
  template: `
    <h1>Development</h1>
    <p class="hint">
      Try any condition. These sessions are saved as development data and are never part of the
      study; real n-of-1 sessions start from Today.
    </p>

    <form (submit)="$event.preventDefault(); start()">
      <fieldset>
        <legend>Condition</legend>
        @for (c of conditions; track c.value) {
          <label class="option">
            <input type="radio" name="condition" [value]="c.value" [checked]="condition() === c.value"
                   (change)="condition.set(c.value)" />
            {{ c.label }} <span class="phase">(phase {{ c.phase }})</span>
          </label>
        }
      </fieldset>

      <button type="submit" [disabled]="!condition() || status() !== 'ok'">Start session</button>
    </form>

    <section aria-labelledby="api-status-heading">
      <h2 id="api-status-heading">Local API</h2>
      <p role="status" [attr.data-status]="status()">{{ statusText() }}</p>
    </section>
  `,
  styles: `
    fieldset { border: 1px solid var(--border); border-radius: 6px; margin: 0 0 1rem; padding: 0.75rem 1rem; }
    .option { display: block; padding: 0.2rem 0; }
    .hint, .phase { color: var(--muted); }
    .hint { margin: 0 0 0.5rem; }
  `,
})
export class StartPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly conditions = CONDITIONS;
  protected readonly condition = signal<Condition | null>(null);

  protected readonly status = toSignal(
    this.api.health().pipe(
      map((): ApiStatus => 'ok'),
      catchError(() => of<ApiStatus>('unavailable')),
    ),
    { initialValue: 'checking' as ApiStatus },
  );
  protected readonly statusText = computed(() => STATUS_TEXT[this.status()]);

  protected start(): void {
    const condition = this.condition();
    if (!condition) return;
    void this.router.navigate(['/session'], { queryParams: { mode: 'dev', condition } });
  }
}
