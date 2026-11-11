import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { ExerciseId } from '../../api/types';
import { AREAS, areaById } from '../../areas';
import { exerciseInfo } from '../../experiences/registry';
import { BOOTH_NOTE, PRACTICE_NOTE } from '../../flow/result-sink';
import { AppEnvironment } from '../../shared/app-environment';
import { Icon } from '../../shared/icon';

/** One area: its topics and their experiences, each with "Try it" (practice mode). */
@Component({
  selector: 'app-area-page',
  imports: [Icon, RouterLink],
  template: `
    @if (area(); as a) {
      <h1>{{ a.title }}</h1>
      <p class="lead">{{ a.intro }}</p>
      <!-- Once per area, before any "Try it": what practice keeps (flow/result-sink.ts). -->
      <p class="muted">{{ practiceNote() }}</p>

      @for (topic of shownTopics(); track topic.title; let t = $index) {
        <section [attr.aria-labelledby]="'topic-heading-' + t">
          <h2 [id]="'topic-heading-' + t">{{ topic.title }}</h2>
          <p>{{ topic.text }}</p>
          <ul class="experiences">
            @for (value of topic.experiences; track value) {
              @if (visible(value); as e) {
                <li class="card">
                  <h3>{{ e.label }}</h3>
                  <p>{{ e.description }} About {{ e.minutes }} minutes.</p>
                  <!-- The method opens the exercise's science explanation ("Why this exercise?"). -->
                  <a class="method" routerLink="/session" [queryParams]="{ mode: 'try', condition: e.value, why: 1 }">
                    <app-icon [name]="e.method.icon" />
                    {{ e.method.name }}<span class="sr-only">: the science behind {{ e.label }}</span>
                  </a>
                  @if (e.experimental) {
                    <p><span class="badge">Experimental</span> This idea is still being tested.</p>
                  }
                  <button type="button" class="try primary" (click)="tryIt(e.value)">Try it</button>
                </li>
              }
            }
          </ul>

          @if (topic.hasExperiment && !environment.booth()) {
            <section class="card prominent" aria-labelledby="experiment-heading">
              <h3 id="experiment-heading">Want to know what works for you?</h3>
              <p>My experiment compares two of these exercises over several weeks.</p>
              <a routerLink="/experiment" class="button-link">Open My experiment</a>
            </section>
          }
        </section>
      }
    } @else if (!waiting()) {
      <h1>Area not found</h1>
      <p><a routerLink="/">Back to Home</a></p>
    }
  `,
  styles: `
    .lead { font-size: 1.1rem; }
    .experiences { list-style: none; padding: 0; display: grid; gap: 1rem;
                   grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); }
    .experiences .card { margin: 0; display: flex; flex-direction: column; align-items: flex-start; }
    .experiences p { margin: 0 0 0.75rem; }
    .method {
      display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 0 0.75rem;
      font-size: 0.9rem; color: var(--accent); text-decoration: none;
    }
    .method:hover { text-decoration: underline; text-underline-offset: 3px; }
    .try { margin-top: auto; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
  `,
})
export class AreaPage {
  private readonly router = inject(Router);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id'))));
  protected readonly environment = inject(AppEnvironment);
  protected readonly area = computed(() => areaById(this.id() ?? null, this.environment.showsDevelopment()));
  /** A development-only area is unknown until the build is known; show nothing meanwhile. */
  protected readonly waiting = computed(
    () => this.environment.value() === null && AREAS.some((a) => a.id === this.id() && a.status === 'development'),
  );
  /** Practice runs Try it; the note describes what its sink keeps (flow/result-sink.ts). */
  protected readonly practiceNote = computed(() => (this.environment.booth() ? BOOTH_NOTE : PRACTICE_NOTE));
  /** A topic whose exercises are all hidden in this build would be an empty section. */
  protected readonly shownTopics = computed(() =>
    (this.area()?.topics ?? []).filter((topic) => topic.experiences.some((value) => this.visible(value))),
  );

  /** Released exercises everywhere; development-only ones in the development build only. */
  protected visible(value: ExerciseId) {
    const e = exerciseInfo(value);
    const shown = e && (e.release === 'released' || this.environment.showsDevelopment()) && this.environment.offers(value);
    return shown ? e : undefined;
  }

  constructor() {
    // The route title is generic; the tab shows the area's own name.
    const title = inject(Title);
    effect(() => title.setTitle(this.area()?.title ?? 'Area not found'));
  }

  /** Practice exercises run in try mode and never touch the experiment. */
  protected tryIt(condition: ExerciseId): void {
    void this.router.navigate(['/session'], { queryParams: { mode: 'try', condition } });
  }
}
