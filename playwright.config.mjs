import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const apiURL = process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const npmRunDev = process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev';
const reuseServers = process.env.E2E_REUSE_SERVERS === '1';

const webServer = [];

if (process.env.E2E_START_BACKEND === '1') {
  webServer.push({
    command: 'php artisan serve --host=127.0.0.1 --port=8000',
    cwd: '../Account-New-Api',
    env: {
      ...process.env,
      APP_ENV: process.env.E2E_BACKEND_ENV || 'testing',
    },
    reuseExistingServer: reuseServers,
    timeout: 120000,
    url: apiURL.replace(/\/api\/?$/, ''),
  });
}

if (process.env.E2E_SKIP_FRONTEND_WEBSERVER !== '1') {
  webServer.push({
    command: npmRunDev,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiURL,
    },
    reuseExistingServer: reuseServers,
    timeout: 120000,
    url: baseURL,
  });
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    timezoneId: 'Asia/Dhaka',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: webServer.length > 0 ? webServer : undefined,
});
