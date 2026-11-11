import { Routes } from '@angular/router';

import { SessionPage } from './flow/session-page';
import { AboutPage } from './pages/about/about-page';
import { AreaPage } from './pages/area/area-page';
import { ExperimentPage } from './pages/experiment/experiment-page';
import { HomePage } from './pages/home/home-page';
import { RecordsPage } from './pages/records/records-page';
import { exerciseAvailable, inBooth, notInBooth } from './shared/access';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Home' },
  { path: 'areas/:id', component: AreaPage, title: 'Area' },
  { path: 'experiment', component: ExperimentPage, title: 'My experiment', canActivate: [notInBooth] },
  { path: 'records', component: RecordsPage, title: 'My records', canActivate: [notInBooth] },
  { path: 'about', component: AboutPage, title: 'About' },
  {
    path: 'session',
    component: SessionPage,
    title: 'Exercise',
    canActivate: [exerciseAvailable],
    resolve: { booth: inBooth },
  },
  {
    path: 'not-available',
    loadComponent: () => import('./pages/not-available/not-available-page').then((m) => m.NotAvailablePage),
    title: 'Not available',
  },
  // The Visual Lab: development build only (the page checks), loaded on demand.
  {
    path: 'lab',
    loadComponent: () => import('./pages/lab/lab-page').then((m) => m.LabPage),
    title: 'Visual Lab',
    canActivate: [notInBooth],
  },
  // Old addresses from before the platform structure.
  { path: 'dev', redirectTo: 'areas/action-growth' },
  { path: 'history', redirectTo: 'records' },
  { path: '**', redirectTo: '' },
];
