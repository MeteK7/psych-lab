import { Component, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

import type { SurfaceScheme } from '../../shared/visual/integration/scene-figure';
import type { ThemeId } from '../../shared/visual/styling/vocabulary';

export interface Swatch {
  /** The token without its prefix: `a-600`, `far`, `subject-lit`. */
  token: string;
  /** Drawn at this opacity, as figures draw it (the grain). */
  opacity?: number;
}

/** Ramp steps as tokens.css writes them: neutral has 500, the area ramps don't (no role uses it). */
export const NEUTRAL_STEPS = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
export const AREA_STEPS = ['050', '100', '200', '300', '400', '600', '700', '800', '900', '950'];

/**
 * Colour swatches for the review sheet, on a surface like a figure's: the S1 tokens (tokens.css)
 * apply to this host, with the area theme and the pinned scheme, so every chip is the real token.
 * Under each chip, the value it resolves to, with ramp colours named by their step (`a-050`).
 */
@Component({
  selector: 'app-lab-swatches',
  host: { '[attr.data-vis-theme]': 'theme()', '[attr.data-vis-scheme]': 'scheme()', '[class.column]': 'column()', '[class.steps]': 'steps()' },
  template: `
    @for (s of swatches(); track s.token) {
      <span class="swatch" [attr.data-token]="s.token">
        @if (values()[s.token] === '') {
          <!-- A step the range doesn't define (the area ranges' 500), so the steps line up with the neutral. -->
          <span class="chip unused"></span>
          <span class="value">{{ s.token.slice(2) }}</span>
          <span class="value">not used</span>
        } @else {
          <span class="chip" [style.background]="'var(--vis-' + s.token + ')'" [style.opacity]="s.opacity ?? null"></span>
          @if (steps()) { <span class="value">{{ s.token.slice(2) }}</span> }
          <span class="value">{{ values()[s.token] ?? '' }}</span>
        }
      </span>
    }
  `,
  styleUrls: ['../../shared/visual/styling/tokens.css'],
  styles: `
    :host { display: flex; flex-wrap: wrap; gap: 4px; }
    :host(.column) { flex-direction: column; flex-wrap: nowrap; }
    .swatch { display: flex; flex-direction: column; width: 52px; height: 40px; }
    :host(.steps) .swatch { height: 54px; }
    :host(.column) .swatch { width: auto; }
    .chip { height: 22px; border-radius: 3px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 18%, transparent); }
    .chip.unused { box-shadow: none; outline: 1px dashed var(--border); outline-offset: -1px; }
    .value { font-size: 0.68rem; line-height: 1.4; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (forced-colors: active) { .value { color: CanvasText; } }
  `,
})
export class LabSwatches {
  readonly theme = input<ThemeId>('action');
  readonly scheme = input.required<SurfaceScheme>();
  readonly swatches = input.required<readonly Swatch[]>();
  readonly column = input(false);
  /** Ramp chips: the step above the value. */
  readonly steps = input(false);

  protected readonly values = signal<Record<string, string>>({});
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => {
      const style = getComputedStyle(this.host);
      const read = (token: string) => style.getPropertyValue(`--vis-${token}`).trim().toLowerCase();
      // Ramp colours by value, so a role shows the step it takes (`far` → `a-050`).
      const steps = new Map<string, string>();
      for (const step of AREA_STEPS) steps.set(read(`a-${step}`), `a-${step}`);
      for (const step of NEUTRAL_STEPS) steps.set(read(`n-${step}`), `n-${step}`);
      const named = (value: string) =>
        value
          .replace(/#[0-9a-f]{3,8}\b/g, (hex) => steps.get(hex) ?? hex)
          .replace(/color-mix\(in srgb, (\S+) (\d+%), transparent\)/g, '$1 · $2');
      const values: Record<string, string> = {};
      for (const { token } of this.swatches()) {
        const value = read(token);
        values[token] = token.startsWith('a-') || token.startsWith('n-') ? value : named(value);
      }
      this.values.set(values);
    });
  }
}
