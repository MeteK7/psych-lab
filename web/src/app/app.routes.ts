import { Routes } from '@angular/router';

import { SessionPage } from './flow/session-page';
import { AboutPage } from './pages/about/about-page';
import { AreaPage } from './pages/area/area-page';
import { ExperimentPage } from './pages/experiment/experiment-page';
import { HomePage } from './pages/home/home-page';
import { RecordsPage } from './pages/records/records-page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Home' },
  { path: 'areas/:id', component: AreaPage, title: 'Area' },
  { path: 'experiment', component: ExperimentPage, title: 'My experiment' },
  { path: 'records', component: RecordsPage, title: 'My records' },
  { path: 'about', component: AboutPage, title: 'About' },
  { path: 'session', component: SessionPage, title: 'Exercise' },
  // The Visual Lab: development build only (the page checks), loaded on demand.
  {
    path: 'lab',
    loadComponent: () => import('./pages/lab/lab-page').then((m) => m.LabPage),
    title: 'Visual Lab',
  },
  // Old addresses from before the platform structure.
  { path: 'dev', redirectTo: 'areas/action-growth' },
  { path: 'history', redirectTo: 'records' },
  { path: '**', redirectTo: '' },
];
