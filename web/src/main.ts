import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { applyStylePack } from './app/shared/visual/start';
import { PLATFORM_PACK } from './app/visual-pack';

// The application's style pack (Stage 3, M0): its themes, ramps and purpose words, before anything is drawn.
applyStylePack(PLATFORM_PACK);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
