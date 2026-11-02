import { defineConfig } from '@playwright/test';

// Browser tests (plan §8, level B): keyboard-only paths, axe accessibility scans and
// reduced motion. They run in the installed Microsoft Edge, against their own API on the
// test database (api/app/e2e_server.py), on ports that never clash with development.
const WEB = 'http://localhost:4320';
const API_PORT = 8120;

export default defineConfig({
  testDir: 'e2e',
  // Tests share one test database; each reads back only its own exercise, so they can
  // run side by side.
  workers: 3,
  fullyParallel: true,
  // The dot and sound tests fast-forward about 5 minutes of rounds, which takes ~3 minutes.
  timeout: 300_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: WEB,
    channel: 'msedge',
    headless: true,
    viewport: { width: 1100, height: 900 },
  },
  webServer: [
    {
      command: `uv run python -m app.e2e_server --port ${API_PORT} --origin ${WEB}`,
      cwd: '../api',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: { UV_PYTHON_DOWNLOADS: 'never' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npx ng serve --port 4320 --proxy-config proxy.e2e.conf.json',
      url: WEB,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
