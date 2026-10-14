import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: '**/*.e2e.ts', fullyParallel: false, workers: 1,
  timeout: 45_000, expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:3009', trace: 'retain-on-failure', screenshot: 'only-on-failure', viewport: { width: 1280, height: 900 } },
  webServer: [
    { command: 'bun widgets/e2e-fixtures.ts && PORT=8089 CLIENT_URL=http://127.0.0.1:3009 DISABLE_BACKGROUND_JOBS=true bun src/index.ts', url: 'http://127.0.0.1:8089/ping', reuseExistingServer: false, timeout: 30_000 },
    { command: 'bun --cwd apps/www dev --port 3009', url: 'http://127.0.0.1:3009', reuseExistingServer: false, timeout: 120_000 },
  ],
});
