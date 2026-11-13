import { defineConfig } from '@playwright/test';

import base from './playwright.config';

// The export script (`npm run visuals:export`, Visual System M7): the browser tests' own setup
// (the same servers on the test database, the same installed Edge), running the one export run in
// tools/visual-export instead of the tests.
export default defineConfig({
  ...base,
  testDir: 'tools/visual-export',
  workers: 1,
  fullyParallel: false,
});
