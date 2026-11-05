import { Component, input, model } from '@angular/core';

import { RatingItem } from '../../content';

let nextId = 0;

/** 0–10 scale built from native radio buttons, so it works with keyboard and screen readers. */
@Component({
  selector: 'app-rating-scale',
  template: `
    <fieldset class="scale">
      <legend>{{ item().label }}</legend>
      <div class="row">
        <div class="options">
          @for (n of points; track n) {
            <label class="point">
              <input
                type="radio"
                [name]="groupName"
                [value]="n"
                [checked]="value() === n"
                (change)="value.set(n)"
              />
              <span>{{ n }}</span>
            </label>
          }
        </div>
        <div class="anchors" aria-hidden="true">
          <span>0 = {{ item().min_label }}</span>
          <span>10 = {{ item().max_label }}</span>
        </div>
      </div>
    </fieldset>
  `,
  styles: `
    .scale { border: 0; padding: 0; margin: 0 0 1.25rem; }
    legend { font-weight: 600; margin-bottom: 0.5rem; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.5rem; }
    .options { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .point { display: inline-flex; flex-direction: column; align-items: center; min-width: 2.25rem; }
    /* The line makes the two labels read as a key, not as captions for the nearest numbers. */
    .anchors {
      display: flex; flex-direction: column; padding-left: 1rem; border-left: 1px solid var(--border);
      color: var(--muted); font-size: 0.875rem;
    }
  `,
})
export class RatingScale {
  readonly item = input.required<RatingItem>();
  readonly value = model<number | null>(null);

  protected readonly points = Array.from({ length: 11 }, (_, i) => i);
  protected readonly groupName = `rating-${nextId++}`;
}
