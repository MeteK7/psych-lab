import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../api/api.service';
import { N1Today } from '../../api/types';
import { AREAS, Area, PLANNED_GUIDE, isOpen } from '../../areas';
import { AppEnvironment } from '../../shared/app-environment';
import { experimentTodayLine } from '../experiment/experiment-texts';

/** The platform as a space of areas; the first feature is one topic inside one area. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <h1>Experiences (working title)</h1>
    <p class="lead">
      Short, guided experiences based on psychology and behavioural science, for learning and
      personal growth. Most take a few minutes. Everything runs on this computer; nothing is sent
      anywhere.
    </p>

    @if (today(); as t) {
      <section class="card prominent" aria-labelledby="experiment-heading">
        <h2 id="experiment-heading">My experiment</h2>
        <p>You're running a personal experiment on getting started with learning. {{ todayLine() }}</p>
        <a routerLink="/experiment" class="button-link">Open My experiment</a>
      </section>
    }

    <h2>Areas</h2>
    @if (environment.booth() && !anyOffered()) {
      <p>Nothing is offered here yet.</p>
    }
    <ul class="areas">
      @for (area of areas; track area.id) {
        <li class="card" [class.planned]="!open(area)">
          <h3>
            @if (open(area)) {
              <a [routerLink]="['/areas', area.id]">{{ area.title }}</a>
            } @else {
              {{ area.title }}
            }
          </h3>
          <p>{{ area.text }}</p>
          @if (open(area)) {
            <span class="badge available">Available</span>
            <a [routerLink]="['/areas', area.id]" class="button-link open">Open</a>
          } @else {
            <span class="badge">Planned</span>
          }
        </li>
      }
    </ul>

    <section class="card planned" aria-labelledby="guide-heading">
      <h2 id="guide-heading">{{ guide.title }}</h2>
      <p>{{ guide.text }}</p>
      <span class="badge">Planned</span>
    </section>

    <p class="muted small">Planned areas are directions, not promises. Research may reshape them.</p>
  `,
  styles: `
    .lead { font-size: 1.1rem; max-width: 44rem; }
    .areas { list-style: none; padding: 0; display: grid; gap: 1rem;
             grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
    .areas .card { margin: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    .areas p { margin: 0; flex: 1; }
    .planned { border-style: dashed; }
    .planned h3, .planned h2 { color: var(--muted); }
    .open { margin-top: 0.25rem; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1.1rem; margin: 0; }
    .small { font-size: 0.9rem; }
  `,
})
export class HomePage {
  protected readonly areas = AREAS;
  protected readonly environment = inject(AppEnvironment);

  /**
   * Development-only areas open in the development build only; elsewhere they show as planned.
   * In a booth, an area opens only if it has an exercise rated safe for unsupervised use.
   */
  protected open(area: Area): boolean {
    const offered = (area.topics ?? []).some((t) => t.experiences.some((e) => this.environment.offers(e)));
    return isOpen(area, this.environment.showsDevelopment()) && (!this.environment.booth() || offered);
  }
  protected readonly anyOffered = computed(() => this.areas.some((a) => this.open(a)));
  protected readonly guide = PLANNED_GUIDE;
  protected readonly today = signal<N1Today | null>(null);
  protected readonly todayLine = computed(() => {
    const t = this.today();
    return t ? experimentTodayLine(t) : '';
  });

  constructor() {
    // The callout is optional: without the API, Home still shows the areas.
    // In a booth the API refuses this (no experiment there), so the callout stays hidden.
    inject(ApiService).n1Today().subscribe({ next: (t) => this.today.set(t), error: () => undefined });
  }
}
