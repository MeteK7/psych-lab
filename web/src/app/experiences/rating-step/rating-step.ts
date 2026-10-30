import { Component, input, output, signal } from '@angular/core';

import { RATINGS } from '../../../content';
import { StepOutcome } from '../../flow/step-outcome';
import { RatingScale } from '../../shared/rating-scale';

/** Pre/post "starting feels unpleasant" rating, asked in every condition. */
@Component({
  selector: 'app-rating-step',
  imports: [RatingScale],
  template: `
    <app-rating-scale [item]="item" [(value)]="value" />
    <button type="button" [disabled]="value() === null" (click)="submit()">Continue</button>
  `,
})
export class RatingStep {
  readonly phase = input.required<'pre' | 'post'>();
  readonly completed = output<StepOutcome>();

  protected readonly item = RATINGS.items.unpleasant;
  protected readonly value = signal<number | null>(null);

  protected submit(): void {
    const value = this.value();
    if (value === null) return;
    this.completed.emit({
      result: { unpleasant: value },
      ratings: { [`unpleasant_${this.phase()}`]: value },
    });
  }
}
