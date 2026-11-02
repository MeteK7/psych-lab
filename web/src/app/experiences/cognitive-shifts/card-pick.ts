import { Component, input, model } from '@angular/core';

import { CsCard } from '../../../content';
import { Pick } from './cs-store';

let nextId = 0;

/**
 * Pick one card, or write your own. Native radio buttons and a text field, so it works with
 * the keyboard and screen readers. Writing clears the card choice, and picking a card clears
 * the text; own text is held in the value only and never saved.
 */
@Component({
  selector: 'app-card-pick',
  template: `
    <fieldset class="pick">
      <legend>{{ legend() }}</legend>
      <div class="cards">
        @for (card of cards(); track card.id) {
          <label class="card-option" [class.chosen]="value()?.id === card.id">
            <input type="radio" [name]="group" [value]="card.id" [checked]="value()?.id === card.id"
                   (change)="value.set({ id: card.id, text: card.text })" />
            <span>{{ card.text }}</span>
          </label>
        }
      </div>
      <label class="own">
        <span>{{ ownLabel() }}</span>
        <input type="text" maxlength="120" [value]="value()?.id === 'own' ? value()!.text : ''"
               (input)="write($event)" />
      </label>
    </fieldset>
  `,
  styles: `
    .pick { border: 0; padding: 0; margin: 0 0 1rem; }
    legend { font-weight: 600; margin-bottom: 0.5rem; }
    .cards { display: grid; gap: 0.5rem; margin-bottom: 0.75rem; }
    .card-option { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.6rem 0.75rem;
                   border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
    .card-option.chosen { border-color: var(--accent); border-width: 2px; padding: calc(0.6rem - 1px) calc(0.75rem - 1px); }
    .card-option input { margin-top: 0.25rem; }
    .own { display: flex; flex-direction: column; gap: 0.25rem; max-width: 32rem; }
    .own input { padding: 0.4rem; font: inherit; }
  `,
})
export class CardPick {
  readonly legend = input.required<string>();
  readonly cards = input.required<CsCard[]>();
  readonly ownLabel = input.required<string>();
  readonly value = model<Pick | null>(null);

  protected readonly group = `card-pick-${nextId++}`;

  protected write(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text.trim() ? { id: 'own', text } : null);
  }
}
