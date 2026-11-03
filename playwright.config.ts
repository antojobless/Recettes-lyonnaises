import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4173/', viewport: { width: 1280, height: 900 } },
  webServer: { command: 'npx vite build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: false, timeout: 120_000 },
});
