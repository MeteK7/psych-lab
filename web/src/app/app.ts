import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ApiService } from './api/api.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  /** The development build says so on every page, so it is never mistaken for the experiment. */
  protected readonly environment = toSignal(
    inject(ApiService)
      .health()
      .pipe(
        map((h) => h.environment),
        catchError(() => of(null)),
      ),
    { initialValue: null },
  );
}
