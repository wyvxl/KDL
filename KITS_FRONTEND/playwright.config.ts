import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E del frontend. El backend se simula con `page.route` (ver e2e/mockApi.ts),
 * así que corren sin Spring Boot ni Oracle: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5199',
    // La panadería trabaja en hora de Costa Rica (UTC-6); los errores de fecha solo se
    // ven con una zona distinta de UTC.
    timezoneId: 'America/Costa_Rica',
    locale: 'es-CR',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
  },
});
