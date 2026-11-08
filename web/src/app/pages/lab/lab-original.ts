import { Component, input } from '@angular/core';

import { MciiBuiltInVisuals } from '../../experiences/mcii/mcii-visual-source';
import { VISUAL_SOURCE, VisualRequest } from '../../shared/visual/visual';
import { VisualSlot } from '../../shared/visual/visual-slot';

/**
 * The MCII picture participants see now (`builtin.v1`), drawn by the exercise's own source and
 * slot, unchanged. The Visual Lab shows it next to a revision, so the two are compared as they
 * really are rather than as a copy.
 */
@Component({
  selector: 'app-lab-mcii-original',
  imports: [VisualSlot],
  providers: [{ provide: VISUAL_SOURCE, useClass: MciiBuiltInVisuals }],
  template: `<app-visual-slot [request]="request()" />`,
  styles: `:host { display: block; } app-visual-slot { margin: 0; }`,
})
export class LabMciiOriginal {
  readonly request = input.required<VisualRequest>();
  static readonly sourceId = new MciiBuiltInVisuals().id;
}
