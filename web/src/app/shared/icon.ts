import { Component, computed, input } from '@angular/core';

/** Line icons on a 24 × 24 grid. They inherit the text colour and are decorative. */
const PATHS = {
  // Methods named on exercise cards
  route: [
    'M6 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    'M18 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    'M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12',
  ],
  flag: ['M5 21V4', 'M5 4h12l-2.5 4.5L17 13H5'],
  layers: ['m12 4-8 4 8 4 8-4z', 'm4 12 8 4 8-4', 'm4 16 8 4 8-4'],
  focus: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'],
  // Two overlapping lenses: one situation, more than one reading.
  lens: ['M9 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12z', 'M15 7a6 6 0 1 1 0 12 6 6 0 0 1 0-12z'],
  // Points on two axes: causes placed on a map.
  causes: ['M4 4v16h16', 'M9 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z', 'M13 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z', 'M17 12a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z'],
  // A question in a speech bubble: not enough to go on.
  question: ['M4 5h16v11H10l-4 3.5V16H4z', 'M10 9a2 2 0 1 1 2.5 1.9c-.3.1-.5.4-.5.7v.4', 'M12 13.5h.01'],
  // A path with a low wall on it, and a way over: the obstacle, then a plan.
  wall: ['M3 19h18', 'M9 13h6v6H9z', 'M5 19c1-9 13-9 14 0'],
  // Parts of a science explanation
  flask: ['M9 3h6', 'M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3', 'M7.5 15h9'],
  play: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'm10 8.5 5.5 3.5-5.5 3.5z'],
  bulb: [
    'M9 18h6',
    'M10 21h4',
    'M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.3V16h6v-.9c0-.5.2-1 .6-1.3A6 6 0 0 0 12 3z',
  ],
  search: ['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'm20 20-4-4'],
  info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 16v-4.5', 'M12 8h.01'],
  alert: [
    'M10.3 4.3 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z',
    'M12 9.5v4',
    'M12 17h.01',
  ],
  book: ['M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z', 'M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z'],
  external: ['M14 4h6v6', 'M10 14 20 4', 'M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5'],
  'chevron-down': ['m6 9 6 6 6-6'],
} as const;

export type IconName = keyof typeof PATHS;

/** Decorative: whatever it marks always has a text label too. */
@Component({
  selector: 'app-icon',
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
export class Icon {
  readonly name = input.required<IconName>();
  protected readonly paths = computed(() => PATHS[this.name()]);
}
