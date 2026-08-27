const { defineConfig, devices } = require('@playwright/test');

const frontendUrl = (process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const apiUrl = (process.env.E2E_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const usesLocalFrontend = !process.env.E2E_FRONTEND_URL && !process.env.CI;

module.exports = defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  outputDir: 'test-results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: frontendUrl,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
    actionTimeout: 10_000,
  },
  webServer: usesLocalFrontend ? {
    command: process.platform === 'win32' ? 'npm.cmd start' : 'npm start',
    url: frontendUrl,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '3001',
      BROWSER: 'none',
      REACT_APP_API_URL: apiUrl,
    },
  } : undefined,
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
});
