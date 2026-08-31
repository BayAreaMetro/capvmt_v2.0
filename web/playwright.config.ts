import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  // Excludes test/unit/**, which holds vitest unit tests for the
  // app/api Route Handlers (see vitest.config.ts) - both runners share
  // the test/ directory, so this keeps Playwright from trying to
  // collect vitest specs.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
