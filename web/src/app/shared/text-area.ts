import { Component, input, model } from '@angular/core';

let nextId = 0;

/**
 * A labelled multi-line field with no length cap, for writing that stays on the screen
 * ("Change the camera angle", docs/camera-angle-design.md §2). Its text lives in the value only:
 * the exercise holds it in its store and never reports it.
 */
@Component({
  selector: 'app-text-area',
  template: `
    <label class="field" [for]="fieldId">{{ label() }}</label>
    <textarea [id]="fieldId" [rows]="rows()" [value]="value()" (input)="value.set($any($event.target).value)"></textarea>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 0.25rem; margin: 0 0 1rem; max-width: 40rem; }
    textarea { font: inherit; padding: 0.4rem; resize: vertical; min-height: 4.5rem; }
  `,
})
export class TextArea {
  readonly label = input.required<string>();
  readonly rows = input(4);
  readonly value = model('');

  protected readonly fieldId = `text-area-${nextId++}`;
}
