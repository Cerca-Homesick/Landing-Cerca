import { defineConfig, devices } from '@playwright/test'

const PORT = 4175
/** BASE_URL=https://www.cercahomesick.com prueba el sitio publicado (sin servidor local). */
const BASE_URL = process.env.BASE_URL

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: BASE_URL ?? `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: BASE_URL
    ? undefined
    : {
        // Clave falsa: PostHog se carga, pero las pruebas responden por él (helpers.ts).
        command: `VITE_POSTHOG_KEY=phc_e2e_test npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
