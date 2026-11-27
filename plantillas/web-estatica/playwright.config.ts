import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4173;
const URL_BASE = `http://localhost:${PUERTO}/__NOMBRE__/`;

// Las pruebas de extremo a extremo corren contra la compilación local, no contra un entorno publicado.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: URL_BASE },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PUERTO} --strictPort`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
  },
});
