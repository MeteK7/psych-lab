import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../api/api.service';
import { SessionOut, Status } from '../../api/types';
import { conditionInfo } from '../../flow/conditions';
import { FollowUpForm } from './follow-up-form';

type LoadState = 'loading' | 'error' | 'loaded';

const RESULT: Record<Status, string> = {
  completed: 'Completed',
  aborted: 'Stopped',
  in_progress: 'Not finished',
};

@Component({
  selector: 'app-records-page',
  imports: [DatePipe, FollowUpForm, RouterLink],
  template: `
    <h1>My records</h1>
    <p>Every exercise you've done, newest first. Experiment exercises can get a short end-of-day follow-up.</p>
    @switch (state()) {
      @case ('loading') {
        <p role="status">Loading…</p>
      }
      @case ('error') {
        <p role="alert">Your records could not be loaded. Is the local server running?</p>
      }
      @case ('loaded') {
        @if (sessions().length === 0) {
          <p>No exercises yet. Try one from <a routerLink="/">Home</a>.</p>
        } @else {
          <table>
            <caption>Most recent first</caption>
            <thead>
              <tr>
                <th scope="col">Date and time</th>
                <th scope="col">Exercise</th>
                <th scope="col">Type</th>
                <th scope="col">Result</th>
                <th scope="col">End-of-day follow-up</th>
              </tr>
            </thead>
            <tbody>
              @for (session of sessions(); track session.id) {
                <tr>
                  <td>{{ session.started_at | date: 'yyyy-MM-dd HH:mm' }}</td>
                  <td>{{ name(session) }}</td>
                  <td>{{ type(session) }}</td>
                  <td>{{ result(session) }}</td>
                  <td>
                    @if (session.followup) {
                      {{ session.followup.self_reported_minutes ?? '–' }} min
                    } @else if (session.n1_reveal_id) {
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
export class RecordsPage {
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

  protected name(session: SessionOut): string {
    return conditionInfo(session.condition)?.label ?? session.condition;
  }

  /** Experiment rows link to a reveal; a linked dev session is a test-mode run (phase 0). */
  protected type(session: SessionOut): string {
    if (session.mode === 'self_use') return 'Experiment';
    return session.n1_reveal_id ? 'Test' : 'Practice';
  }

  protected result(session: SessionOut): string {
    return RESULT[session.status];
  }

  protected toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  protected onSaved(updated: SessionOut): void {
    this.sessions.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
    this.openId.set(null);
  }
}
