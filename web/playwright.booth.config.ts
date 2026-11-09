import { defineConfig } from '@playwright/test';

import base from './playwright.config';

// The booth profile's browser tests (M1): their own API, in the booth profile, on the test
// database, with one exercise rated safe for the tests only (api/app/e2e_server.py --booth).
// Run with: npx playwright test -c playwright.booth.config.ts
const WEB = 'http://localhost:4330';
const API_PORT = 8130;

export default defineConfig({
  ...base,
  testDir: 'e2e-booth',
  workers: 1,
  use: { ...base.use, baseURL: WEB },
  webServer: [
    {
      command: `uv run python -m app.e2e_server --booth --port ${API_PORT} --origin ${WEB}`,
      cwd: '../api',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: { UV_PYTHON_DOWNLOADS: 'never' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npx ng serve --port 4330 --proxy-config proxy.e2e-booth.conf.json',
      url: WEB,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
