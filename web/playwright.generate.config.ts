import { defineConfig } from '@playwright/test';

// The authoring script for generated pictures (`npm run visuals:generate`, Visual System M7 stage
// C): one run in tools/visual-generate, with no browser and no server. Playwright is used only to
// run the TypeScript.
export default defineConfig({
  testDir: 'tools/visual-generate',
  workers: 1,
  reporter: [['list']],
});
