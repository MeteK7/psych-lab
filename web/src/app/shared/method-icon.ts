import { Component, computed, input } from '@angular/core';

/** Line icons for the methods named on exercise cards, on a 24 × 24 grid. */
const PATHS = {
  // A route between two points: planning when and how you'll start.
  route: [
    'M6 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    'M18 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    'M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12',
  ],
  // A flag: the goal you intend to reach.
  flag: ['M5 21V4', 'M5 4h12l-2.5 4.5L17 13H5'],
  // Stacked layers: two things held in mind at once.
  layers: ['m12 4-8 4 8 4 8-4z', 'm4 12 8 4 8-4', 'm4 16 8 4 8-4'],
  // A focus mark: attention turned to something else.
  focus: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'],
} as const;

export type MethodIconName = keyof typeof PATHS;

/** Decorative: the method's name always appears next to it. */
@Component({
  selector: 'app-method-icon',
  template: `
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    svg { display: block; }
  `,
})
export class MethodIcon {
  readonly name = input.required<MethodIconName>();
  protected readonly paths = computed(() => PATHS[this.name()]);
}
