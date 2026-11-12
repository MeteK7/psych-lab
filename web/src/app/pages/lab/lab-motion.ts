import { Component, Signal, computed, input, signal } from '@angular/core';

import { Composed, lookupOf } from '../../shared/visual/composition/compose';
import { TextLookup } from '../../shared/visual/composition/scene';
import { QualityTier, SceneFigure, SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import { changeMovers } from '../../shared/visual/motion/plan-motion';
import { BAR_SETS, ROUTE_STOPS, SET_SIZES, barsFigure, routeFigure, setFigure } from './lab-motion-figures';
import { describeMover } from './lab-movers';

interface Reference {
  id: string;
  name: string;
  about: string;
  composed: Signal<Composed>;
  text: Signal<TextLookup>;
  /** What moved in the last change, in words, with the reasons. */
  moved: Signal<{ id: string; what: string; why: string }[]>;
}

/** A reference drawn from data, remembering the figure before the last change. */
function reference(id: string, name: string, about: string, compose: () => Composed): Reference {
  let last: Composed | null = null;
  const pair = computed(() => {
    const now = compose();
    const before = last;
    last = now;
    return { before, now };
  });
  const composed = computed(() => pair().now);
  return {
    id,
    name,
    about,
    composed,
    text: computed(() => lookupOf(composed())),
    moved: computed(() => {
      const { before, now } = pair();
      return before ? changeMovers(before.scene, now.scene).map(describeMover) : [];
    }),
  };
}

/**
 * The Visual Lab's motion section (milestone M5): figures built from data that change. When the
 * data changes, the same figure is drawn again; what `moves` glides there, together, as one
 * movement, and what is new enters. Each change is listed with what moved and why.
 */
@Component({
  selector: 'app-lab-motion',
  imports: [SceneFigure],
  styleUrls: ['./lab.css'],
  styles: `
    .actions { display: flex; gap: 0.5rem; margin: 0 0 0.5rem; }
  `,
  template: `
    <section class="scene" aria-labelledby="lab-motion">
      <h2 id="lab-motion">Motion between values<span class="meta"> · S5 · M5 · reference compositions</span></h2>
      <p class="note muted">
        A figure built from data is drawn again when its data changes. Elements marked to move glide to their new place, shape
        and colour together, as one movement; new ones enter; ones that go fade or are taken back, when they say why; everything
        else changes at once. With reduced motion, the new figure shows at once.
      </p>
      <label class="tier">Motion in these figures
        <select [value]="tier()" (change)="tier.set($any($event.target).value)">
          <option value="auto">As your system setting</option>
          <option value="full">Full</option>
          <option value="reduced">Reduced (as with reduced motion: no movement)</option>
        </select>
      </label>
      @for (ref of references; track ref.id) {
        <h3>{{ ref.name }}</h3>
        <p class="note">{{ ref.about }}</p>
        <div class="actions">
          @switch (ref.id) {
            @case ('bars') {
              <button type="button" (click)="nextValues()">New values</button>
            }
            @case ('set') {
              <button type="button" (click)="resize(1)" [disabled]="count() >= sizes.max">Add a member</button>
              <button type="button" (click)="resize(-1)" [disabled]="count() <= sizes.min">Remove a member</button>
            }
            @case ('route') {
              <button type="button" (click)="stop(1)" [disabled]="stops() >= routeStops.max">Add a stop</button>
              <button type="button" (click)="stop(-1)" [disabled]="stops() <= routeStops.min">Remove a stop</button>
            }
          }
        </div>
        <div class="grid">
          @for (scheme of schemes(); track scheme) {
            <div class="panel" [class]="scheme">
              <span class="tag">{{ ref.composed().scene.id }} · {{ scheme }}</span>
              <figure role="img" [attr.aria-label]="ref.composed().text['alt']" [attr.data-motion]="ref.id + '-' + scheme">
                <app-vis-scene [scene]="ref.composed().scene" state="shown" [text]="ref.text()" [scheme]="scheme" [tier]="tier()" />
              </figure>
            </div>
          }
        </div>
        <ul class="moves" [attr.aria-label]="'What moved: ' + ref.name" [attr.data-moved]="ref.id">
          @for (m of ref.moved(); track m.id) {
            <li><code>{{ m.id }}</code> {{ m.what }}@if (m.why) {: {{ m.why }}}</li>
          } @empty {
            <li class="muted">Nothing has changed yet.</li>
          }
        </ul>
      }
    </section>
  `,
})
export class LabMotion {
  readonly schemes = input.required<SurfaceScheme[]>();
  protected readonly tier = signal<QualityTier | 'auto'>('auto');
  protected readonly sizes = SET_SIZES;
  private readonly set = signal(0);
  protected readonly count = signal(5);
  protected readonly routeStops = ROUTE_STOPS;
  protected readonly stops = signal(4);
  protected readonly references: Reference[] = [
    reference('bars', 'Values that change', 'Three bars whose heights are their values; their numbers move with them.', () => barsFigure(BAR_SETS[this.set()])),
    reference('set', 'A set that reflows', 'Members on a ring: adding or removing one moves the others to make room; one that leaves fades.', () => setFigure(this.count())),
    reference('route', 'A route that grows and shrinks', 'A new leg is drawn to the new stop; a leg that goes is taken back, and its stop fades with it.', () => routeFigure(this.stops())),
  ];

  protected nextValues(): void {
    this.set.update((i) => (i + 1) % BAR_SETS.length);
  }

  protected stop(by: number): void {
    this.stops.update((n) => Math.min(Math.max(n + by, ROUTE_STOPS.min), ROUTE_STOPS.max));
  }

  protected resize(by: number): void {
    this.count.update((n) => Math.min(Math.max(n + by, SET_SIZES.min), SET_SIZES.max));
  }
}
