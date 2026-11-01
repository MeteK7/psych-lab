import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { ApiService } from '../../api/api.service';

type ApiStatus = 'checking' | 'ok' | 'unavailable';

const STATUS_TEXT: Record<ApiStatus, string> = {
  checking: 'Checking…',
  ok: 'Connected',
  unavailable: 'Not reachable: start the API (see the runbook).',
};

@Component({
  selector: 'app-about-page',
  template: `
    <h1>About this prototype</h1>
    <p>
      This is an early, local version of a platform of short, guided experiences based on
      psychology and behavioural science.
    </p>
    <ul class="points">
      <li>
        <strong>Evidence:</strong> some experiences use well-studied techniques, such as planning
        when and how to start. Others are experimental: they build on research from related areas
        and are still being tested. Experimental ones are marked.
      </li>
      <li><strong>Your data:</strong> everything is stored on this computer only. Nothing is sent anywhere.</li>
      <li>
        <strong>Not therapy:</strong> these experiences aren't a treatment and don't replace
        professional help. If you're struggling, talk to someone you trust or to a professional.
      </li>
    </ul>
    <h2>Local server</h2>
    <p role="status" [attr.data-status]="status()">{{ statusText() }}</p>
  `,
  styles: `
    .points li { margin-bottom: 0.5rem; }
    h2 { font-size: 1.15rem; }
  `,
})
export class AboutPage {
  protected readonly status = toSignal(
    inject(ApiService).health().pipe(
      map((): ApiStatus => 'ok'),
      catchError(() => of<ApiStatus>('unavailable')),
    ),
    { initialValue: 'checking' as ApiStatus },
  );
  protected readonly statusText = computed(() => STATUS_TEXT[this.status()]);
}
