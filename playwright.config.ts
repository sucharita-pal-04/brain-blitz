import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', channel: 'msedge', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
