import { defineConfig } from '@playwright/test'

export default defineConfig({
  fullyParallel: false,
  reporter: 'line',
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { trace: 'retain-on-failure' },
  workers: 1,
})
