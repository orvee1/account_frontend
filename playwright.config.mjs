import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const apiURL = process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const backendBaseURL = apiURL.replace(/\/+$/, '').replace(/\/api$/i, '');
const reuseServers = process.env.E2E_REUSE_SERVERS === '1';
const npmRunDev = process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev';

function resolveBackendDirectory() {
  if (process.env.E2E_BACKEND_CWD) return path.resolve(configDir, process.env.E2E_BACKEND_CWD);
  const candidates = ['../Account-New-Api', '../account_backend-main', '../account_backend'].map(dir => path.resolve(configDir, dir));
  return candidates.find(dir => fs.existsSync(path.join(dir, 'artisan'))) || candidates[0];
}
function localServer(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error('Automatic E2E server startup requires a local HTTP URL. Start other servers manually.');
  }
  return { host: parsed.hostname, port: parsed.port || '80' };
}

const webServer = [];
if (process.env.E2E_START_BACKEND === '1') {
  const cwd = resolveBackendDirectory();
  if (!fs.existsSync(path.join(cwd, 'artisan'))) throw new Error('E2E_BACKEND_CWD must contain Laravel artisan.');
  const environment = process.env.E2E_BACKEND_ENV || 'testing';
  if (!/^[a-zA-Z0-9_-]+$/.test(environment)) throw new Error('Invalid E2E_BACKEND_ENV.');
  const { host, port } = localServer(backendBaseURL);
  webServer.push({
    command: 'php artisan serve --env=' + environment + ' --host=' + host + ' --port=' + port,
    cwd,
    env: { ...process.env, APP_ENV: environment },
    reuseExistingServer: reuseServers,
    timeout: 120000,
    url: backendBaseURL,
  });
}
if (process.env.E2E_SKIP_FRONTEND_WEBSERVER !== '1') {
  const { host, port } = localServer(baseURL);
  webServer.push({
    command: npmRunDev + ' -- --hostname ' + host + ' --port ' + port,
    cwd: configDir,
    env: { ...process.env, NEXT_PUBLIC_API_URL: apiURL },
    reuseExistingServer: reuseServers,
    timeout: 120000,
    url: baseURL,
  });
}

export default defineConfig({
  testDir: path.join(configDir, 'tests/e2e'),
  outputDir: path.join(configDir, 'test-results'),
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  // A retry must provision a fresh company first; replaying a partial workbook is unsafe.
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(configDir, 'playwright-report') }],
  ],
  use: {
    baseURL,
    timezoneId: 'Asia/Dhaka',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: webServer.length ? webServer : undefined,
});
