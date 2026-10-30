import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { ApiService } from '../../api/api.service';
import { SessionOut } from '../../api/types';
import { FollowUpForm } from './follow-up-form';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-history-page',
  imports: [DatePipe, FollowUpForm],
  template: `
    <h1>History</h1>
    @switch (state()) {
      @case ('loading') {
        <p role="status">Loading sessions…</p>
      }
      @case ('error') {
        <p role="alert">Sessions could not be loaded. Is the API running?</p>
      }
      @case ('loaded') {
        @if (sessions().length === 0) {
          <p>No sessions yet.</p>
        } @else {
          <table>
            <caption>Most recent sessions first</caption>
            <thead>
              <tr>
                <th scope="col">Started</th>
                <th scope="col">Mode</th>
                <th scope="col">Condition</th>
                <th scope="col">Status</th>
                <th scope="col">Follow-up (min)</th>
              </tr>
            </thead>
            <tbody>
              @for (session of sessions(); track session.id) {
                <tr>
                  <td>{{ session.started_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                  <td>{{ session.mode }}</td>
                  <td>{{ session.condition }}</td>
                  <td>{{ session.status }}</td>
                  <td>
                    @if (session.followup) {
                      {{ session.followup.self_reported_minutes ?? '–' }}
                    } @else if (session.status === 'completed') {
                      <button type="button" (click)="toggle(session.id)"
                              [attr.aria-expanded]="openId() === session.id">
                        Add follow-up
                      </button>
                    } @else {
                      –
                    }
                  </td>
                </tr>
                @if (openId() === session.id) {
                  <tr>
                    <td colspan="5">
                      <app-follow-up-form [sessionId]="session.id" (saved)="onSaved($event)" />
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        }
      }
    }
  `,
})
export class HistoryPage {
  private readonly api = inject(ApiService);

  protected readonly state = signal<LoadState>('loading');
  protected readonly sessions = signal<SessionOut[]>([]);
  protected readonly openId = signal<string | null>(null);

  constructor() {
    this.api.listSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  protected toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  protected onSaved(updated: SessionOut): void {
    this.sessions.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
    this.openId.set(null);
  }
}
