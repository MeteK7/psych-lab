import { Component, ElementRef, inject, input } from '@angular/core';

import { paintItems } from '../rendering/canvas/canvas-backend';
import { tokenColours } from '../rendering/canvas/colour';
import { ExportFacts, frameToSvg } from '../rendering/export/svg-export';
import type { ResolvedFrame } from '../rendering/frame';

export type { ExportFacts };
export { SVG_EXPORTER } from '../rendering/export/svg-export';

/**
 * S9 Integration: exports frames as files (milestone M7). It is a token scope like a backend's
 * surface, pinned to one theme and scheme (the page's own tokens come from where it sits: the Lab
 * puts it in a light or a dark panel), so every colour a frame names resolves to that scheme's
 * colour, whatever the person's own setting. It draws nothing on the page.
 * - `svg`: the frame as a standalone SVG (rendering/export/svg-export.ts), the same bytes each time;
 * - `png`: the frame painted by the canvas backend at 1×, 2× or more, on a clear ground. The parity
 *   suite vouches for the canvas, and checks these files against the figures on screen.
 */
@Component({
  selector: 'app-vis-export',
  host: { '[attr.data-vis-theme]': 'theme()', '[attr.data-vis-scheme]': 'scheme()', hidden: '' },
  template: '',
  styleUrls: ['../styling/tokens.css'],
  styles: `:host { display: none; }`,
})
export class ExportScope {
  readonly theme = input.required<string>();
  readonly scheme = input.required<'light' | 'dark'>();

  private readonly colour = tokenColours(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);

  /** The frame as a standalone SVG, for this scope's theme and scheme. */
  svg(frame: ResolvedFrame, facts: ExportFacts): string {
    this.colour.forget();
    return frameToSvg(frame, this.colour, facts);
  }

  /** The frame as a PNG, `scale` device pixels per unit, on a clear ground. */
  async png(frame: ResolvedFrame, scale = 1): Promise<Blob> {
    this.colour.forget();
    await document.fonts.ready;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(frame.width * scale);
    canvas.height = Math.round(frame.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser gives no 2D canvas to export on');
    ctx.setTransform(canvas.width / frame.width, 0, 0, canvas.height / frame.height, 0, 0);
    paintItems(ctx, frame, frame.items.map((item) => ({ item, opacity: 1, offset: [0, 0], reveal: null, paint: null })), this.colour);
    return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The PNG could not be made'))), 'image/png'));
  }
}
