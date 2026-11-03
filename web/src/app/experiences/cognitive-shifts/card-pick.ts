import { Component, effect, input, linkedSignal, model, untracked } from '@angular/core';

import { CsCard } from '../../../content';
import { Pick } from './cs-store';

let nextId = 0;

/**
 * Pick one card, or choose "my own" and write it. One group of native radio buttons, with the
 * own option last; choosing it opens the text field, so what's selected is always visible and
 * nothing is unticked behind the person's back. Switching to a card closes the field but keeps
 * the text, so it comes back on switching back. Own text is held in the value only and never saved.
 */
@Component({
  selector: 'app-card-pick',
  template: `
    <fieldset class="pick">
      <legend>{{ legend() }}</legend>
      @if (cards().length) {
        <div class="cards">
          @for (card of cards(); track card.id) {
            <label class="card-option" [class.chosen]="!own() && value()?.id === card.id">
              <input type="radio" [name]="group" [value]="card.id" [checked]="!own() && value()?.id === card.id"
                     (change)="chooseCard(card)" />
              <span>{{ card.text }}</span>
            </label>
          }
          <label class="card-option" [class.chosen]="own()">
            <input type="radio" [name]="group" value="own" [checked]="own()" (change)="chooseOwn()" />
            <span>{{ ownChoice() }}</span>
          </label>
        </div>
      }
      @if (own()) {
        <label class="own">
          <span>{{ ownLabel() }}</span>
          <input type="text" maxlength="120" [value]="ownText()" (input)="write($event)" />
        </label>
      }
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
  /** The label of the "my own" option. */
  readonly ownChoice = input.required<string>();
  /** The label of the text field it opens. */
  readonly ownLabel = input.required<string>();
  readonly value = model<Pick | null>(null);

  protected readonly group = `card-pick-${nextId++}`;
  /**
   * Whether "my own" is chosen, and its text; both start afresh when the cards change (next lens).
   * With no cards to pick from (an own situation in CS3), the field is simply open.
   */
  protected readonly own = linkedSignal({ source: this.cards, computation: (cards) => cards.length === 0 });
  protected readonly ownText = linkedSignal({ source: this.cards, computation: () => '' });

  constructor() {
    // A parent that clears the choice (after adding a cause, or for the next lens) clears "my own" too.
    effect(() => {
      if (this.value() === null && untracked(() => this.ownText().trim())) {
        untracked(() => {
          this.own.set(this.cards().length === 0);
          this.ownText.set('');
        });
      }
    });
  }

  protected chooseCard(card: CsCard): void {
    this.own.set(false);
    this.value.set({ id: card.id, text: card.text });
  }

  protected chooseOwn(): void {
    this.own.set(true);
    this.value.set(this.ownText().trim() ? { id: 'own', text: this.ownText() } : null);
  }

  protected write(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.ownText.set(text);
    this.value.set(text.trim() ? { id: 'own', text } : null);
  }
}
