import { NgComponentOutlet } from '@angular/common';
import { Component, Type, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AppEnvironment } from './shared/app-environment';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgComponentOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  /** The development build says so on every page, so it is never mistaken for the experiment. */
  protected readonly environment = inject(AppEnvironment);
  /** The booth's idle reset, loaded only in a booth, so other builds never download it. */
  protected readonly idleReset = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      if (this.environment.booth() && !this.idleReset()) {
        void import('./shared/idle-reset').then((m) => this.idleReset.set(m.IdleReset));
      }
    });
  }
}
