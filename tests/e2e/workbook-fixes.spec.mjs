import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const fixturePath = new URL('../../../qa/browser-fixture.json', import.meta.url);
const fixture = fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath)) : null;
const field = (page, label) => page.locator('form label').filter({ hasText: label }).locator('..').locator('input,select').first();

test('product opening stock and cash/bank settlements work through browser forms', async ({ page }) => {
  test.skip(!fixture, 'Run php qa/browser-fixture.php against account_api_testing before this browser test.');
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  await page.goto('/');
  await page.locator('#email').fill(fixture.email);
  await page.locator('#password').fill(fixture.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.locator('#email')).toHaveCount(0, { timeout: 30000 });
  const api = async (method, path, payload) => {
    const response = await page.request.fetch('/api/backend' + path, { method, data: payload });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.json();
  };
  await api('POST', '/customers', { name: 'Browser Customer', customer_number: 'BROWSER-C' });
  await api('POST', '/vendors', { name: 'Browser Supplier', vendor_number: 'BROWSER-V' });
  await page.goto('/products');
  await page.getByRole('button', { name: 'Add New', exact: true }).click();
  await page.getByPlaceholder('Product name').fill('Browser Keyboard');
  await page.getByPlaceholder('SKU', { exact: true }).fill('BROWSER-KB');
  await field(page, /^Costing Price$/).fill('500');
  await field(page, /^Opening Quantity$/).fill('10');
  await page.locator('form label').filter({ hasText: /^Warehouse/ }).locator('..').getByRole('combobox').click();
  await page.getByText('QA Warehouse', { exact: true }).last().click();
  const productSaved = page.waitForResponse(r => /\/products(?:\?|$)/.test(r.url()) && r.request().method() === 'POST');
  await page.locator('form button[type="submit"]').click();
  expect((await productSaved).status()).toBe(201);
  const products = await api('GET', '/products');
  const keyboard = products.data.find(p => p.sku === 'BROWSER-KB');
  expect(Number(keyboard.current_stock_in_base_uom)).toBe(10);
  expect(Number(keyboard.weighted_avg_cost)).toBe(500);
  expect(keyboard.units.length).toBeGreaterThan(0);

  for (const [route, noun, partyLabel, party, amount, mode] of [
    ['receipts', 'Receipt', 'Received From', 'Browser Customer', '200000', 'cash'],
    ['payments', 'Payment', 'Vendor', 'Browser Supplier', '150000', 'cash'],
    ['receipts', 'Receipt', 'Received From', 'Browser Customer', '10000', 'bank_transfer'],
    ['payments', 'Payment', 'Vendor', 'Browser Supplier', '15000', 'bank_transfer'],
  ]) {
    await page.goto('/transactions/' + route);
    await page.getByRole('button', { name: new RegExp('New ' + noun) }).click();
    await field(page, new RegExp('^' + partyLabel + '$')).fill(party);
    await field(page, new RegExp('^' + noun + ' Number$')).fill('BROWSER-' + fixture.company_id + '-' + route + '-' + mode);
    await field(page, /^Amount/).fill(amount);
    await field(page, /^Payment Mode$/).selectOption(mode);
    await field(page, /^Status$/).selectOption('completed');
    const saved = page.waitForResponse(r => new RegExp('/' + route + '(?:\\?|$)').test(r.url()) && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create ' + noun, exact: true }).click();
    expect((await saved).status()).toBe(201);
    await expect(page.locator('form')).toHaveCount(0);
  }
  const trial = await api('GET', '/reports/trial-balance');
  const account = code => trial.accounts.find(a => a.code === code);
  expect(Number(account('1.1.1.1').debit) - Number(account('1.1.1.1').credit)).toBe(50000);
  expect(Number(account('1.1.1.2.1').debit) - Number(account('1.1.1.2.1').credit)).toBe(-5000);
  await page.goto('/transactions/receipts');
  await page.getByRole('button', { name: /New Receipt/ }).click();
  await field(page, /^Received From$/).fill('Missing Customer');
  await field(page, /^Receipt Number$/).fill('BROWSER-INVALID');
  await field(page, /^Amount/).fill('100');
  await page.getByRole('button', { name: 'Create Receipt', exact: true }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText('Customer not found');
  await expect(field(page, /^Received From$/)).toHaveValue('Missing Customer');
  await page.screenshot({ path: '../qa/browser-form-validation.png', fullPage: true });
});
