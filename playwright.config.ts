import { defineConfig, devices } from '@playwright/test'

// End-to-end smoke tests (e2e/*.e2e.ts — not *.spec.ts, so Vitest doesn't
// pick them up). They run against the production build (`pnpm build`
// first) with every /api/v1/* call answered by fixtures inside the test
// (see e2e/support.ts), so no backend or database is needed.
const PORT = Number(process.env.E2E_PORT || 3100)

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // This codebase's test hooks are data-cy (see CLAUDE.md), not data-testid.
    testIdAttribute: 'data-cy',
    locale: 'en-US',
    ...devices['Desktop Chrome'],
    viewport: { width: 1600, height: 1000 },
    // Optional: point at an already-installed Chromium instead of
    // `playwright install chromium` (handy offline / on locked-down laptops).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
