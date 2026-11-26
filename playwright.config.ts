import { defineConfig, devices } from '@playwright/test';
import { Env } from './src/config/Env';

// Let Node (API requests in fixtures) trust the OS certificate store, so corporate
// proxy certificates work. Set before workers are spawned; they inherit it.
process.env.NODE_USE_SYSTEM_CA ??= '1';

const DEMOQA_SPECS = /[\\/]sites[\\/]demoqa[\\/]/;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './test',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // spec-data: serial — CI is capped at one worker to limit load on the shared remote demoqa.com; data isolation does not depend on it (per-worker account via workerUser)
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: Env.baseUrl,
    headless: true,

    /* Test-id contract (saucedemo): elements carry data-test; getByTestId() resolves it. Other sites do not use test ids. */
    testIdAttribute: 'data-test',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testIgnore: DEMOQA_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: DEMOQA_SPECS,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testIgnore: DEMOQA_SPECS,
      use: { ...devices['Desktop Safari'] },
    },

    // demoqa specs run in ONE project (chromium engine) against demoqa.com. Each worker creates its own
    // account through the API (workerUser fixture, spec-data-standard R1), so workers no longer share
    // an identity. Firefox/webkit variants can be added once a project-scoped run is verified (M5).
    {
      name: 'demoqa',
      testMatch: DEMOQA_SPECS,
      // Fixture setup/teardown (API calls to the remote demoqa.com) counts inside the test timeout:
      // a mutating TC takes ~16s of fixtures + ~12s of steps, so the 30s default fails intermittently.
      timeout: 90_000,
      use: { ...devices['Desktop Chrome'], baseURL: Env.demoqaUrl },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});