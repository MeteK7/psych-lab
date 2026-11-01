import { Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../api/api.service';
import { SessionOut } from '../../api/types';

/** End-of-day self-report for one experiment exercise (labelled as self-report in analysis, plan §4.2). */
@Component({
  selector: 'app-follow-up-form',
  template: `
    <form (submit)="$event.preventDefault(); submit()" class="follow-up">
      <label>
        About how many minutes did you spend learning after this exercise?
        <input type="number" min="0" max="1440" step="1" required [value]="minutes() ?? ''"
               (input)="minutes.set(toNumber($event))" />
      </label>
      <label>
        Optional: how much of a burden was the exercise? (0 = none · 10 = very heavy)
        <select (change)="burden.set(toNumber($event))">
          <option value="">No answer</option>
          @for (n of points; track n) {
            <option [value]="n">{{ n }}</option>
          }
        </select>
      </label>
      <label>
        Optional note (only you see this)
        <input type="text" maxlength="500" [value]="note()" (input)="note.set(text($event))" />
      </label>
      <button type="submit" [disabled]="!valid() || saving()">Save</button>
      @if (error()) {
        <p role="alert">Could not save the follow-up.</p>
      }
    </form>
  `,
  styles: `
    .follow-up { display: grid; gap: 0.5rem; max-width: 32rem; padding: 0.5rem 0 1rem; }
    label { display: flex; flex-direction: column; gap: 0.2rem; }
    input, select { font: inherit; padding: 0.3rem; }
  `,
})
export class FollowUpForm {
  private readonly api = inject(ApiService);

  readonly sessionId = input.required<string>();
  readonly saved = output<SessionOut>();

  protected readonly points = Array.from({ length: 11 }, (_, i) => i);
  protected readonly minutes = signal<number | null>(null);
  protected readonly burden = signal<number | null>(null);
  protected readonly note = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  protected valid(): boolean {
    const m = this.minutes();
    return m !== null && Number.isInteger(m) && m >= 0 && m <= 1440;
  }

  protected toNumber(event: Event): number | null {
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    return raw === '' ? null : Number(raw);
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected async submit(): Promise<void> {
    if (!this.valid()) return;
    this.saving.set(true);
    this.error.set(false);
    try {
      const updated = await firstValueFrom(
        this.api.recordFollowUp(this.sessionId(), {
          self_reported_minutes: this.minutes(),
          burden: this.burden(),
          note: this.note().trim() || null,
        }),
      );
      this.saved.emit(updated);
    } catch {
      this.error.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
