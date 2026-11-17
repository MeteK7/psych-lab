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
import { provideCardFigures } from '../../shared/visual/integration/card-figures';
import { VisualSlot } from '../../shared/visual/visual-slot';

/** One area: its topics and their experiences, each with "Try it" (practice mode). */
@Component({
  selector: 'app-area-page',
  imports: [Icon, RouterLink, VisualSlot],
  providers: [provideCardFigures()],
  template: `
    @if (area(); as a) {
      <h1>{{ a.title }}</h1>
      <p class="lead">{{ a.intro }}</p>
      <!-- Once per area, before any "Try it": what practice keeps (flow/result-sink.ts). -->
      <p class="muted">{{ practiceNote() }}</p>

      <!-- Topics side by side: a topic with one exercise is one column; one with several takes the full width. -->
      <div class="topics">
        @for (topic of shownTopics(); track topic.title; let t = $index) {
          <section [attr.aria-labelledby]="'topic-heading-' + t" [class.wide]="shownCount(topic) > 1">
            <h2 [id]="'topic-heading-' + t">{{ topic.title }}</h2>
            <p class="muted">{{ topic.text }}</p>
            <ul class="experiences">
              @for (value of topic.experiences; track value) {
                @if (visible(value); as e) {
                  <li class="card">
                    <!-- The card's figure (Visual System, scenes/cards.ts); nothing when an exercise has none. -->
                    <app-visual-slot class="figure" [request]="{ scene: e.value }" />
                    <div class="body">
                      <h3>{{ e.label }}</h3>
                      <p>{{ e.description }}</p>
                      <p class="meta">
                        <span>About {{ e.minutes }} minutes</span>
                        <!-- The method opens the exercise's science explanation ("Why this exercise?"). -->
                        <a class="method" routerLink="/session" [queryParams]="{ mode: 'try', condition: e.value, why: 1 }">
                          <app-icon [name]="e.method.icon" />
                          {{ e.method.name }}<span class="sr-only">: the science behind {{ e.label }}</span>
                        </a>
                      </p>
                      @if (e.experimental) {
                        <p><span class="badge">Experimental</span> This idea is still being tested.</p>
                      }
                      <button type="button" class="try primary" (click)="tryIt(e.value)">Try it</button>
                    </div>
                  </li>
                }
              }
            </ul>

          </section>
        }
      </div>

      <!-- Below every topic, so the exercises stay together; once per area, for an area with an experiment. -->
      @if (hasExperiment() && !environment.booth()) {
        <section class="card prominent experiment" aria-labelledby="experiment-heading">
          <h2 id="experiment-heading">Want to know what works for you?</h2>
          <p>My experiment compares two of these exercises over several weeks.</p>
          <a routerLink="/experiment" class="button-link">Open My experiment</a>
        </section>
      }
    } @else if (!waiting()) {
      <h1>Area not found</h1>
      <p><a routerLink="/">Back to Home</a></p>
    }
  `,
  styles: `
    /* The grid follows the page's own width (the wide column on a large window), not the window's. */
    :host { display: block; container: area / inline-size; }
    /* The title sits one padding below the top bar; the words keep a reading width on a wide page. */
    h1 { margin-top: 0; }
    h1, .lead, :host > p.muted { max-width: 48rem; }
    .lead { font-size: 1.1rem; }
    /*
     * Columns by the width there is, each card at least about 18rem, so its figure stays readable:
     * one below 38rem, two up to 76.5rem, four from there. Never three and one.
     */
    .topics { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 1.5rem; row-gap: 2.25rem; margin-top: 1.75rem; }
    /* A one-exercise topic: its heading, text and card share rows with its neighbour's, so they line up. */
    .topics > section:not(.wide) { display: grid; grid-template-rows: subgrid; grid-row: span 3; row-gap: 0; }
    .topics > section.wide { grid-column: 1 / -1; }
    h2 { font-size: 1.25rem; margin: 0; }
    section > p.muted { margin: 0.15rem 0 0.75rem; }
    .experiences { list-style: none; padding: 0; margin: 0; display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); }
    @container area (min-width: 38rem) {
      .topics, .wide .experiences { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @container area (min-width: 76.5rem) {
      .topics, .wide .experiences { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .experiences .card { margin: 0; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
    /* The figure runs edge to edge across the top of the card, above a hairline. */
    .figure { max-width: none; margin: 0; border-bottom: 1px solid var(--border); }
    .body { padding: 1.25rem 1.5rem 1.5rem; flex: 1; display: flex; flex-direction: column; align-items: flex-start; }
    .body p { margin: 0 0 0.9rem; }
    .meta { display: flex; flex-wrap: wrap; align-items: center; column-gap: 1.1rem; row-gap: 0.25rem; font-size: 0.9rem; color: var(--muted); }
    .method { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--accent); text-decoration: none; }
    .method:hover { text-decoration: underline; text-underline-offset: 3px; }
    .try { margin-top: auto; }
    .experiment { margin: 2.25rem 0 0; }
    .experiment h2 { margin-bottom: 0.4rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    h3 { font-size: 1.25rem; margin: 0 0 0.4rem; }
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

  /** Whether a topic shown here belongs to My experiment: its card then closes the page. */
  protected readonly hasExperiment = computed(() => this.shownTopics().some((topic) => topic.hasExperiment));

  /** How many of a topic's exercises this build shows: more than one takes the full width. */
  protected shownCount(topic: { experiences: readonly ExerciseId[] }): number {
    return topic.experiences.filter((value) => this.visible(value)).length;
  }

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
