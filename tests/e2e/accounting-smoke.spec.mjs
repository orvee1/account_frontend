import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const apiURL = process.env.E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const e2eEmail = process.env.E2E_EMAIL || 'jahirul.iit5th@gmail.com';
const e2ePassword = process.env.E2E_PASSWORD || '123456';

async function signInThroughForm(page) {
  await page.goto('/');

  const emailInput = page.locator('#email');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(e2eEmail);
  await page.locator('#password').fill(e2ePassword);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('button', { name: /sign in/i })).toHaveCount(0);
  await expect(page.locator('body')).toContainText(/Sales Overview|Profit \/ Loss Overview|Major Expenses/);
}

async function signInByApi(request, context) {
  const apiRoot = apiURL.replace(/\/+$/, '').replace(/\/api$/i, '');
  const response = await request.post(`${apiRoot}/api/login`, {
    data: {
      email: e2eEmail,
      password: e2ePassword,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  await context.addCookies([
    {
      name: '__BearerLoginToken',
      value: data.token,
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: '__CompanyId',
      value: String(data.company_id || data.user?.company_id),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function expectAccountingScreen(page, path, expectedText) {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('body')).not.toContainText(/Email address/i);
  await expect(page.locator('body')).toContainText(expectedText);
}

test.describe('accounting workflow shell', () => {
  test('login form establishes an authenticated session', async ({ page }) => {
    await signInThroughForm(page);
  });

  test('opens the core accounting workflow screens with an authenticated session', async ({ context, page, request }) => {
    await signInByApi(request, context);

    await expectAccountingScreen(page, '/', /Sales Overview|Profit \/ Loss Overview|Major Expenses/);
    await expectAccountingScreen(page, '/products', /Search products\/services|No products found|Product/);
    await expectAccountingScreen(page, '/purchases/new', /Bill No|Vendor|Purchase|Loading/);
    await expectAccountingScreen(page, '/sales/invoices/new', /Create Advanced Invoice/);
    await expectAccountingScreen(page, '/reports/trial-balance', /Trial Balance|No data available/);
    await expectAccountingScreen(page, '/reports/balance-sheet', /Balance Sheet|No data available/);
  });
});
