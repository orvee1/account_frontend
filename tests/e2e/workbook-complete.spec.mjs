import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { toDateInput } from '../../utils/accounting-date.mjs';
const fixtureFile = new URL('../../../qa/workbook-ui-fixture.json', import.meta.url);
const fixture = fs.existsSync(fixtureFile) ? JSON.parse(fs.readFileSync(fixtureFile)) : null;
const field = (page, label) => page.locator('form label').filter({ hasText: label }).locator('..').locator('input,select').first();

test('all twenty workbook steps can be performed through accounting screens', async ({ page }) => {
  test.skip(!fixture, 'Create a separate empty workbook UI fixture.');
  test.setTimeout(300000);
  page.setDefaultTimeout(15000);
  const evidence = [];
  const api = async path => {
    const response = await page.request.get('/api/backend/' + path);
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.json();
  };
  const saved = (path, method = 'POST') => page.waitForResponse(r => new RegExp('/' + path + '(?:\\?|$)').test(r.url()) && r.request().method() === method);
  const checkSaved = async promise => { const response = await promise; expect(response.status(), await response.text()).toBe(201); return response.json(); };
  const choice = async (locator, name) => { await locator.click(); await page.getByRole('option', { name, exact: true }).click(); };
  const step = async (number, action) => test.step('Workbook step ' + number, async () => { await action(); evidence.push({ step: number, status: 'PASS' }); });
  await page.goto('/');
  await page.locator('#email').fill(fixture.email);
  await page.locator('#password').fill(fixture.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.locator('#email')).toHaveCount(0);
  const tag = String(fixture.company_id);
  const names = { laptop: 'Laptop ' + tag, keyboard: 'Keyboard ' + tag, tech: 'Tech Supplier ' + tag, global: 'Global Enterprise ' + tag, rahman: 'Rahman Trading ' + tag, standard: 'Standard Store ' + tag };
  const ids = {};
  const today = toDateInput();
  const createProduct = async (name, sku, qty, cost) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Add New', exact: true }).click();
    await page.getByPlaceholder('Product name').fill(name);
    await page.getByPlaceholder('SKU', { exact: true }).fill(sku);
    await field(page, /^Costing Price$/).fill(String(cost));
    await field(page, /^Opening Quantity$/).fill(String(qty));
    await page.locator('form label').filter({ hasText: /^Warehouse/ }).locator('..').getByRole('combobox').click();
    await page.getByText('QA Warehouse', { exact: true }).last().click();
    const response = saved('products');
    await page.locator('form button[type="submit"]').click();
    await checkSaved(response);
    return (await api('products?per_page=1000')).data.find(p => p.sku === sku).id;
  };
  const party = async (type, name, balance) => {
    await page.goto('/' + type);
    await page.getByRole('button', { name: 'Add New', exact: true }).click();
    if (type === 'customers') {
      await page.locator('#customerName').fill(name);
      await page.locator('#customerNumber').fill(name.replaceAll(' ', '-'));
      await choice(page.locator('#openingBalanceType'), 'Debit');
      await page.locator('#openingBalance').fill(String(balance));
      await page.locator('#openingBalanceDate').fill(today);
    } else {
      await page.getByPlaceholder('Client Omega Corp.').fill(name);
      await page.getByPlaceholder('V001', { exact: true }).fill(name.replaceAll(' ', '-'));
      await field(page, /^Opening Balance$/).fill(String(balance));
      await choice(page.locator('form label').filter({ hasText: /^Opening Balance Type/ }).locator('..').getByRole('combobox'), 'Credit');
      await field(page, /^Opening Balance Date$/).fill(today);
    }
    const response = saved(type);
    await page.locator('form button[type="submit"]').click();
    await checkSaved(response);
    await expect(page.locator('form')).toHaveCount(0);
    return (await api(type + '?per_page=1000')).data.find(p => p.name === name).id;
  };
  const stock = async (quantity, cost) => {
    const product = await api('products/' + ids.laptop);
    expect(Number(product.current_stock_in_base_uom)).toBe(quantity);
    expect(Number(product.weighted_avg_cost)).toBeCloseTo(cost, 2);
  };
  const purchase = async (number, quantity, rate) => {
    await page.goto('/purchases/new');
    await choice(page.locator('#vendor'), names.tech);
    await page.locator('#bill_no').fill('UI-' + tag + '-P' + number);
    const row = page.locator('tbody tr').first();
    await choice(row.getByRole('combobox').first(), names.laptop);
    await row.locator('input[type="number"]').nth(0).fill(String(quantity));
    await row.locator('input[type="number"]').nth(1).fill(String(rate));
    const response = saved('purchase-bills');
    await page.getByRole('button', { name: 'Save Bill', exact: true }).click();
    await checkSaved(response);
  };
  const sale = async (quantity, rate) => {
    await page.goto('/sales/invoices/new');
    await field(page, /^Customer$/).selectOption(String(ids.rahman));
    const row = page.locator('tbody tr').first();
    await row.locator('select').first().selectOption(String(ids.laptop));
    await row.locator('input[type="number"]').nth(0).fill(String(quantity));
    await row.locator('input[type="number"]').nth(1).fill(String(rate));
    const response = saved('sales-invoices');
    await page.getByRole('button', { name: 'Save Invoice', exact: true }).click();
    return checkSaved(response);
  };
  try {
    await step(1, async () => { ids.laptop = await createProduct(names.laptop, 'UI-L-' + tag, 0, 0); ids.keyboard = await createProduct(names.keyboard, 'UI-K-' + tag, 10, 500); await stock(0, 0); });
    await step(2, async () => { ids.tech = await party('vendors', names.tech, 0); ids.global = await party('vendors', names.global, 20000); });
    await step(3, async () => { ids.rahman = await party('customers', names.rahman, 0); ids.standard = await party('customers', names.standard, 15000); });
    await step(4, () => purchase(1, 10, 50000));
    await step(5, () => stock(10, 50000));
    await step(6, () => purchase(2, 5, 56000));
    await step(7, () => stock(15, 52000));
    let firstInvoice;
    await step(8, async () => { firstInvoice = await sale(8, 65000); });
    await step(9, () => stock(7, 52000));
    await step(10, () => purchase(3, 5, 50000));
    await step(11, () => stock(12, 51166.6667));
    await step(12, async () => {
      await page.goto('/purchases/returns');
      await page.getByRole('button', { name: 'New Purchase Return', exact: true }).click();
      await page.getByLabel('Supplier', { exact: true }).selectOption(String(ids.tech));
      await page.getByLabel('Return Number').fill('UI-' + tag + '-PR');
      await page.getByLabel('Warehouse', { exact: true }).selectOption(String(fixture.warehouse_id));
      await page.getByLabel('Product', { exact: true }).selectOption(String(ids.laptop));
      await page.getByLabel('Quantity', { exact: true }).fill('2');
      await page.getByLabel('Return Rate', { exact: true }).fill('50000');
      const response = saved('purchase-returns');
      await page.getByRole('button', { name: 'Save Purchase Return' }).click();
      await checkSaved(response);
    });
    await step(13, () => stock(10, 51400));
    let secondInvoice;
    await step(14, async () => { secondInvoice = await sale(4, 60000); });
    await step(15, () => stock(6, 51400));
    await step(16, () => purchase(4, 4, 58000));
    await step(17, () => stock(10, 54040));
    await step(18, async () => {
      const invoice = secondInvoice.data || secondInvoice;
      await page.goto('/sales/returns');
      await page.getByRole('button', { name: 'New Return', exact: true }).click();
      await field(page, /^Customer$/).selectOption(String(ids.rahman));
      await page.getByLabel('Source Invoice').selectOption(String(invoice.id));
      await page.getByLabel('Invoice Item', { exact: true }).selectOption({ label: names.laptop + ' - invoiced quantity 4' });
      await field(page, /^Qty$/).fill('1');
      const response = saved('sales-returns');
      await page.getByRole('button', { name: 'Save Return', exact: true }).click();
      await checkSaved(response);
      await stock(11, 53800);
    });
    const settlement = async (route, partyName, amount, mode) => {
      const noun = route === 'receipts' ? 'Receipt' : 'Payment';
      await page.goto('/transactions/' + route);
      await page.getByRole('button', { name: 'New ' + noun, exact: true }).click();
      await field(page, route === 'receipts' ? /^Received From$/ : /^Vendor$/).fill(partyName);
      await field(page, new RegExp('^' + noun + ' Number$')).fill('UI-' + tag + '-' + route + '-' + mode);
      await field(page, /^Amount/).fill(String(amount));
      await field(page, /^Payment Mode$/).selectOption(mode);
      await field(page, /^Status$/).selectOption('completed');
      const response = saved(route);
      await page.getByRole('button', { name: 'Create ' + noun, exact: true }).click();
      await checkSaved(response);
    };
    await step(19, async () => { await settlement('receipts', names.rahman, 200000, 'cash'); await settlement('payments', names.tech, 150000, 'cash'); });
    await step(20, async () => {
      await settlement('receipts', names.standard, 10000, 'bank_transfer');
      await settlement('payments', names.global, 15000, 'bank_transfer');
      const trial = await api('reports/trial-balance');
      const net = code => { const a = trial.accounts.find(a => a.code === code); return Number(a.debit) - Number(a.credit); };
      expect(net('1.1.1.1')).toBe(50000);
      expect(net('1.1.1.2.1')).toBe(-5000);
      const parties = [...(await api('customers')).data, ...(await api('vendors')).data];
      for (const [name, expected] of [[names.rahman, 500000], [names.standard, 5000], [names.tech, -1012000], [names.global, -5000]]) {
        const party = parties.find(p => p.name === name);
        const account = trial.accounts.find(a => a.name.startsWith('Customer - ' + party.name + ' (') || a.name.startsWith('Vendor - ' + party.name + ' ('));
        expect(Number(account.debit) - Number(account.credit), name).toBe(expected);
      }
      expect(net('1.1.5.1.1')).toBe(596800);
      expect(-net('4.1.1.1') - net('5.1.1.1')).toBe(129800);
      expect(Number(trial.totalDebit)).toBe(Number(trial.totalCredit));
      await page.goto('/reports/trial-balance');
      await expect(page.locator('main').first()).toContainText('Trial Balance');
      await expect(page.locator('input[type="date"]')).toHaveValue(today);
      const inventoryRow = page.getByRole('row').filter({ hasText: 'Stock in Hand Ledger' });
      await expect(inventoryRow).toContainText('1,318,400.00');
      await expect(inventoryRow).toContainText('721,600.00');
      await page.screenshot({ path: '../qa/workbook-ui-final.png', fullPage: true });
    });
  } finally { fs.writeFileSync(new URL('../../../qa/workbook-ui-results.json', import.meta.url), JSON.stringify({ company_id: fixture.company_id, steps: evidence, completed: evidence.length === 20, executed_at: new Date().toISOString() }, null, 2)); }
});
