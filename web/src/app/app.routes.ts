import { Routes } from '@angular/router';

import { SessionPage } from './flow/session-page';
import { HistoryPage } from './pages/history/history-page';
import { StartPage } from './pages/start/start-page';
import { TodayPage } from './pages/today/today-page';

export const routes: Routes = [
  { path: '', component: TodayPage, title: 'Today' },
  { path: 'dev', component: StartPage, title: 'Development' },
  { path: 'session', component: SessionPage, title: 'Session' },
  { path: 'history', component: HistoryPage, title: 'History' },
  { path: '**', redirectTo: '' },
];
