import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { FollowUp, Health, Mode, N1Today, SessionOut, SessionUpsert } from './types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  health(): Observable<Health> {
    return this.http.get<Health>('/api/health');
  }

  listSessions(mode?: Mode): Observable<SessionOut[]> {
    const params: Record<string, string> = mode ? { mode } : {};
    return this.http.get<SessionOut[]>('/api/sessions', { params });
  }

  /** Idempotent: the client generates the id, so retries are safe. */
  saveSession(id: string, body: SessionUpsert): Observable<SessionOut> {
    return this.http.put<SessionOut>(`/api/sessions/${id}`, body);
  }

  recordFollowUp(id: string, body: FollowUp): Observable<SessionOut> {
    return this.http.patch<SessionOut>(`/api/sessions/${id}/follow-up`, body);
  }

  // n-of-1 daily records. Every write returns the refreshed Today view.

  n1Today(): Observable<N1Today> {
    return this.http.get<N1Today>('/api/n1/today');
  }

  n1PlanDay(date: string, plannedStart: string): Observable<N1Today> {
    return this.http.put<N1Today>(`/api/n1/days/${date}`, { planned_start: plannedStart });
  }

  n1ReportBarrier(reason: string): Observable<N1Today> {
    return this.http.post<N1Today>('/api/n1/barrier', { reason });
  }

  /** Reveals today's slot, or returns it again if already revealed. */
  n1Reveal(): Observable<N1Today> {
    return this.http.post<N1Today>('/api/n1/reveal', {});
  }

  n1StudyStart(text: string): Observable<N1Today> {
    return this.http.post<N1Today>('/api/n1/study-start', { text });
  }
}
