import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toDateInput } from '../../utils/accounting-date.mjs';
// Prefer fresh per-run fixtures; an explicitly selected seeded login is also supported.
const fixtureFile = new URL('../../../qa/workbook-ui-fixture.json', import.meta.url);
const fixture = fs.existsSync(fixtureFile) ? JSON.parse(fs.readFileSync(fixtureFile, 'utf8')) : null;
const e2eEmail = fixture?.email || process.env.E2E_WORKBOOK_EMAIL;
const e2ePassword = fixture?.password || process.env.E2E_WORKBOOK_PASSWORD;
const qaDir = fileURLToPath(new URL('../../../qa/', import.meta.url));
fs.mkdirSync(qaDir, {
    recursive: true,
});
const field = (page, label) => page
    .locator('form label')
    .filter({
    hasText: label,
})
    .locator('..')
    .locator('input,select')
    .first();
const number = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed)
        ? parsed
        : 0;
};
const sumNested = (value) => {
    if (value === null ||
        value === undefined) {
        return 0;
    }
    if (typeof value !==
        'object') {
        return number(value);
    }
    return Object
        .values(value)
        .reduce((total, item) => total +
        sumNested(item), 0);
};
test('all twenty workbook steps can be performed through accounting screens', async ({ page, }) => {
    // A setup failure must not leave an earlier successful report looking current.
    fs.writeFileSync(path.join(qaDir, 'workbook-ui-results.json'), JSON.stringify({ completed: false, phase: 'setup', steps: [], executed_at: new Date().toISOString() }, null, 2));
    expect(e2eEmail && e2ePassword, 'Run php qa/browser-fixture.php --workbook, or configure E2E_WORKBOOK_EMAIL and E2E_WORKBOOK_PASSWORD for the guarded seeder.').toBeTruthy();
    test.setTimeout(600000);
    page.setDefaultTimeout(20000);
    const evidence = [];
    let companyId = null;
    let warehouseId = null;
    const api = async (apiPath) => {
        const response = await page.request.get(`/api/backend/${apiPath}`);
        const responseText = await response.text();
        expect(response.ok(), responseText).toBeTruthy();
        if (!responseText) {
            return null;
        }
        return JSON.parse(responseText);
    };
    const saved = (apiPath, method = 'POST') => page.waitForResponse((response) => new RegExp(`/${apiPath}(?:\\?|$)`).test(response.url()) &&
        response
            .request()
            .method() ===
            method);
    const checkSaved = async (responsePromise) => {
        const response = await responsePromise;
        const responseText = await response.text();
        expect(response.status(), responseText).toBe(201);
        if (!responseText) {
            return null;
        }
        return JSON.parse(responseText);
    };
    const choice = async (locator, name) => {
        await locator.click();
        await page
            .getByRole('option', {
            name,
            exact: true,
        })
            .click();
    };
    const step = async (stepNumber, action) => test.step(`Workbook step ${stepNumber}`, async () => {
        try {
            await action();
            evidence.push({
                step: stepNumber,
                status: 'PASS',
            });
        }
        catch (error) {
            evidence.push({
                step: stepNumber,
                status: 'FAIL',
                message: error instanceof
                    Error
                    ? error.message
                    : String(error),
            });
            throw error;
        }
    });
    await page.goto('/');
    await page
        .locator('#email')
        .fill(e2eEmail);
    await page
        .locator('#password')
        .fill(e2ePassword);
    await page
        .getByRole('button', {
        name: /sign in/i,
    })
        .click();
    await expect(page.locator('#email')).toHaveCount(0);
    const currentUserResponse = await api('user');
    const currentUser = currentUserResponse
        ?.user;
    expect(currentUser, 'Authenticated user could not be resolved.').toBeTruthy();
    companyId =
        Number(currentUser
            .company_id);
    expect(companyId).toBeGreaterThan(0);
    if (fixture) expect(companyId).toBe(Number(fixture.company_id));
    else expect(currentUser?.company?.name).toBe('Workbook E2E Company');
    const warehousesResponse = await api('warehouses?per_page=1000');
    const warehouses = warehousesResponse
        ?.data ||
        [];
    const qaWarehouse = warehouses.find((warehouse) => warehouse.name ===
        'QA Warehouse');
    expect(qaWarehouse, 'QA Warehouse was not found. Run WorkbookE2ESeeder first.').toBeTruthy();
    warehouseId =
        Number(qaWarehouse.id);
    expect(warehouseId).toBeGreaterThan(0);
    const initialProducts = await api('products?per_page=1000');
    const initialCustomers = await api('customers?per_page=1000');
    const initialVendors = await api('vendors?per_page=1000');
    const initialTrialBalance = await api(`reports/trial-balance?as_of_date=${toDateInput()}`);
    expect(initialProducts
        ?.data
        ?.length ??
        0, 'Workbook QA company already contains products. Create a fresh isolated workbook fixture before rerunning.').toBe(0);
    expect(initialCustomers
        ?.data
        ?.length ??
        0, 'Workbook QA company already contains customers. Create a fresh isolated workbook fixture before rerunning.').toBe(0);
    expect(initialVendors
        ?.data
        ?.length ??
        0, 'Workbook QA company already contains vendors. Create a fresh isolated workbook fixture before rerunning.').toBe(0);
    expect(initialTrialBalance
        ?.accounts
        ?.length ??
        0, 'Workbook QA company already contains accounting journals. Create a fresh isolated workbook fixture before rerunning.').toBe(0);
    const tag = String(companyId);
    const names = {
        laptop: `Laptop ${tag}`,
        keyboard: `Keyboard ${tag}`,
        tech: `Tech Supplier ${tag}`,
        global: `Global Enterprise ${tag}`,
        rahman: `Rahman Trading ${tag}`,
        standard: `Standard Store ${tag}`,
    };
    const ids = {};
    const today = toDateInput();
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const createProduct = async (name, sku, qty, cost) => {
        await page.goto('/products');
        await page
            .getByRole('button', {
            name: 'Add New',
            exact: true,
        })
            .click();
        await page
            .getByPlaceholder('Product name')
            .fill(name);
        await page
            .getByPlaceholder('SKU', {
            exact: true,
        })
            .fill(sku);
        await field(page, /^Costing Price$/).fill(String(cost));
        await field(page, /^Opening Quantity$/).fill(String(qty));
        await page
            .locator('form label')
            .filter({
            hasText: /^Warehouse/,
        })
            .locator('..')
            .getByRole('combobox')
            .click();
        await page
            .getByText('QA Warehouse', {
            exact: true,
        })
            .last()
            .click();
        if (Number(qty) >
            0) {
            const openingDate = field(page, /^Opening\s+Stock\s+Date/);
            await expect(openingDate).toBeVisible();
            await openingDate.fill(today);
        }
        const response = saved('products');
        await page
            .locator('form button[type="submit"]')
            .click();
        await checkSaved(response);
        const products = await api('products?per_page=1000');
        const product = products
            .data
            .find((item) => item.sku ===
            sku);
        expect(product, `Product ${sku} was not found after creation.`).toBeTruthy();
        return Number(product.id);
    };
    const party = async (type, name, openingBalance) => {
        await page.goto(`/${type}`);
        await page
            .getByRole('button', {
            name: 'Add New',
            exact: true,
        })
            .click();
        if (type ===
            'customers') {
            await page
                .locator('#customerName')
                .fill(name);
            await page
                .locator('#customerNumber')
                .fill(name.replaceAll(' ', '-'));
            await choice(page.locator('#openingBalanceType'), 'Debit');
            await page
                .locator('#openingBalance')
                .fill(String(openingBalance));
            await page
                .locator('#openingBalanceDate')
                .fill(today);
        }
        else {
            await page
                .getByPlaceholder('Client Omega Corp.')
                .fill(name);
            await page
                .getByPlaceholder('V001', {
                exact: true,
            })
                .fill(name.replaceAll(' ', '-'));
            await field(page, /^Opening Balance$/).fill(String(openingBalance));
            await choice(page
                .locator('form label')
                .filter({
                hasText: /^Opening Balance Type/,
            })
                .locator('..')
                .getByRole('combobox'), 'Credit');
            await field(page, /^Opening Balance Date$/).fill(today);
        }
        const response = saved(type);
        await page
            .locator('form button[type="submit"]')
            .click();
        await checkSaved(response);
        await expect(page.locator('form')).toHaveCount(0);
        const parties = await api(`${type}?per_page=1000`);
        const createdParty = parties
            .data
            .find((item) => item.name ===
            name);
        expect(createdParty, `${type} party ${name} was not found after creation.`).toBeTruthy();
        return Number(createdParty.id);
    };
    const stock = async (expectedQuantity, expectedCost) => {
        const product = await api(`products/${ids.laptop}`);
        expect(Number(product
            .current_stock_in_base_uom)).toBeCloseTo(expectedQuantity, 4);
        expect(Number(product
            .weighted_avg_cost)).toBeCloseTo(expectedCost, 2);
    };
    const purchase = async (sequence, quantity, rate) => {
        await page.goto('/purchases/new');
        await choice(page.locator('#vendor'), names.tech);
        await page
            .locator('#bill_no')
            .fill(`UI-${tag}-P${sequence}`);
        const row = page
            .locator('tbody tr')
            .first();
        await choice(row
            .getByRole('combobox')
            .first(), names.laptop);
        await row
            .locator('input[type="number"]')
            .nth(0)
            .fill(String(quantity));
        await row
            .locator('input[type="number"]')
            .nth(1)
            .fill(String(rate));
        const response = saved('purchase-bills');
        await page
            .getByRole('button', {
            name: 'Save Bill',
            exact: true,
        })
            .click();
        return checkSaved(response);
    };
    const sale = async (quantity, rate) => {
        await page.goto('/sales/invoices/new');
        await field(page, /^Customer$/).selectOption(String(ids.rahman));
        const row = page
            .locator('tbody tr')
            .first();
        await row
            .locator('select')
            .first()
            .selectOption(String(ids.laptop));
        await row
            .locator('input[type="number"]')
            .nth(0)
            .fill(String(quantity));
        await row
            .locator('input[type="number"]')
            .nth(1)
            .fill(String(rate));
        const response = saved('sales-invoices');
        await page
            .getByRole('button', {
            name: 'Save Invoice',
            exact: true,
        })
            .click();
        return checkSaved(response);
    };
    const settlement = async (route, partyName, amount, mode) => {
        const noun = route ===
            'receipts'
            ? 'Receipt'
            : 'Payment';
        await page.goto(`/transactions/${route}`);
        await page
            .getByRole('button', {
            name: `New ${noun}`,
            exact: true,
        })
            .click();
        await field(page, route ===
            'receipts'
            ? /^Received From$/
            : /^Vendor$/).fill(partyName);
        await field(page, new RegExp(`^${noun} Number$`)).fill(`UI-${tag}-${route}-${mode}`);
        await field(page, /^Amount/).fill(String(amount));
        await field(page, /^Payment Mode$/).selectOption(mode);
        const statusField = field(page, /^Status$/);
        await expect(statusField).toHaveValue('completed');
        const response = saved(route);
        await page
            .getByRole('button', {
            name: `Create ${noun}`,
            exact: true,
        })
            .click();
        return checkSaved(response);
    };
    try {
        await step(1, async () => {
            ids.laptop =
                await createProduct(names.laptop, `UI-L-${tag}`, 0, 0);
            ids.keyboard =
                await createProduct(names.keyboard, `UI-K-${tag}`, 10, 500);
            await stock(0, 0);
            const keyboard = await api(`products/${ids.keyboard}`);
            expect(Number(keyboard
                .current_stock_in_base_uom)).toBeCloseTo(10, 4);
            expect(Number(keyboard
                .weighted_avg_cost)).toBeCloseTo(500, 2);
        });
        await step(2, async () => {
            ids.tech =
                await party('vendors', names.tech, 0);
            ids.global =
                await party('vendors', names.global, 20000);
        });
        await step(3, async () => {
            ids.rahman =
                await party('customers', names.rahman, 0);
            ids.standard =
                await party('customers', names.standard, 15000);
        });
        await step(4, async () => {
            await purchase(1, 10, 50000);
        });
        await step(5, async () => {
            await stock(10, 50000);
        });
        await step(6, async () => {
            await purchase(2, 5, 56000);
        });
        await step(7, async () => {
            await stock(15, 52000);
        });
        await step(8, async () => {
            await sale(8, 65000);
        });
        await step(9, async () => {
            await stock(7, 52000);
        });
        await step(10, async () => {
            await purchase(3, 5, 50000);
        });
        await step(11, async () => {
            await stock(12, 51166.6667);
        });
        await step(12, async () => {
            await page.goto('/purchases/returns');
            await page
                .getByRole('button', {
                name: 'New Purchase Return',
                exact: true,
            })
                .click();
            await page
                .getByLabel('Supplier', {
                exact: true,
            })
                .selectOption(String(ids.tech));
            await page
                .getByLabel('Return Number')
                .fill(`UI-${tag}-PR`);
            await page
                .getByLabel('Warehouse', {
                exact: true,
            })
                .selectOption(String(warehouseId));
            await page
                .getByLabel('Product', {
                exact: true,
            })
                .selectOption(String(ids.laptop));
            await page
                .getByLabel('Quantity', {
                exact: true,
            })
                .fill('2');
            await page
                .getByLabel('Return Rate', {
                exact: true,
            })
                .fill('50000');
            const response = saved('purchase-returns');
            await page
                .getByRole('button', {
                name: 'Save Purchase Return',
            })
                .click();
            await checkSaved(response);
        });
        await step(13, async () => {
            await stock(10, 51400);
        });
        let secondInvoice;
        await step(14, async () => {
            secondInvoice =
                await sale(4, 60000);
        });
        await step(15, async () => {
            await stock(6, 51400);
        });
        await step(16, async () => {
            await purchase(4, 4, 58000);
        });
        await step(17, async () => {
            await stock(10, 54040);
        });
        await step(18, async () => {
            const invoice = secondInvoice
                ?.data ||
                secondInvoice;
            expect(invoice?.id).toBeTruthy();
            await page.goto('/sales/returns');
            await page
                .getByRole('button', {
                name: 'New Return',
                exact: true,
            })
                .click();
            await field(page, /^Customer$/).selectOption(String(ids.rahman));
            await page
                .getByLabel('Source Invoice')
                .selectOption(String(invoice.id));
            await page
                .getByLabel('Invoice Item', {
                exact: true,
            })
                .selectOption({
                label: `${names.laptop} - invoiced quantity 4`,
            });
            await field(page, /^Qty$/).fill('1');
            const response = saved('sales-returns');
            await page
                .getByRole('button', {
                name: 'Save Return',
                exact: true,
            })
                .click();
            await checkSaved(response);
            await stock(11, 53800);
        });
        await step(19, async () => {
            await settlement('receipts', names.rahman, 200000, 'cash');
            await settlement('payments', names.tech, 150000, 'cash');
        });
        await step(20, async () => {
            await settlement('receipts', names.standard, 10000, 'bank_transfer');
            await settlement('payments', names.global, 15000, 'bank_transfer');
            const trial = await api(`reports/trial-balance?as_of_date=${today}`);
            const net = (code) => {
                const account = trial.accounts
                    .find((item) => item.code ===
                    code);
                expect(account, `Trial-balance account ${code} not found.`).toBeTruthy();
                return (Number(account.debit) -
                    Number(account.credit));
            };
            expect(net('1.1.1.1')).toBeCloseTo(50000, 2);
            expect(net('1.1.1.2.1')).toBeCloseTo(-5000, 2);
            const customers = await api('customers?per_page=1000');
            const vendors = await api('vendors?per_page=1000');
            const parties = [
                ...customers.data,
                ...vendors.data,
            ];
            const partyExpectations = [
                [
                    names.rahman,
                    500000,
                ],
                [
                    names.standard,
                    5000,
                ],
                [
                    names.tech,
                    -1012000,
                ],
                [
                    names.global,
                    -5000,
                ],
            ];
            for (const [partyName, expected,] of partyExpectations) {
                const party = parties.find((item) => item.name ===
                    partyName);
                expect(party, `Party ${partyName} not found.`).toBeTruthy();
                const account = trial.accounts
                    .find((item) => item.name.startsWith(`Customer - ${party.name} (`) ||
                    item.name.startsWith(`Vendor - ${party.name} (`));
                expect(account, `Party ledger account for ${partyName} not found.`).toBeTruthy();
                expect(Number(account.debit) -
                    Number(account.credit), partyName).toBeCloseTo(expected, 2);
            }
            expect(net('1.1.5.1.1')).toBeCloseTo(596800, 2);
            expect(Number(trial.totalDebit)).toBeCloseTo(Number(trial.totalCredit), 2);
            const income = await api(`reports/income-statement?start_date=${yearStart}&end_date=${today}`);
            expect(Number(income
                .salesBreakdown
                .grossSales)).toBeCloseTo(760000, 2);
            expect(Number(income
                .salesBreakdown
                .salesReturns)).toBeCloseTo(60000, 2);
            expect(Number(income
                .salesBreakdown
                .netSales)).toBeCloseTo(700000, 2);
            expect(Number(income
                .salesBreakdown
                .grossCostOfSales)).toBeCloseTo(621600, 2);
            expect(Number(income
                .salesBreakdown
                .salesReturnCostReversal)).toBeCloseTo(51400, 2);
            expect(Number(income
                .salesBreakdown
                .netCostOfSales)).toBeCloseTo(570200, 2);
            expect(Number(income
                .revenue
                .salesRevenue)).toBeCloseTo(700000, 2);
            expect(Number(income
                .costOfGoods
                .costOfSales)).toBeCloseTo(570200, 2);
            const netProfit = Number(income
                .salesBreakdown
                .netSales) -
                Number(income
                    .salesBreakdown
                    .netCostOfSales);
            expect(netProfit).toBeCloseTo(129800, 2);
            const balanceSheet = await api(`reports/balance-sheet?as_of_date=${today}`);
            const totalAssets = sumNested(balanceSheet.assets);
            const totalLiabilities = sumNested(balanceSheet.liabilities);
            const totalEquity = sumNested(balanceSheet.equity);
            expect(Number(balanceSheet
                .equity
                .currentProfitLoss)).toBeCloseTo(129800, 2);
            expect(totalAssets).toBeCloseTo(1146800, 2);
            expect(totalLiabilities).toBeCloseTo(1017000, 2);
            expect(totalEquity).toBeCloseTo(129800, 2);
            expect(totalLiabilities +
                totalEquity).toBeCloseTo(totalAssets, 2);
            const stockReport = await api('reports/stock-report');
            expect(Number(stockReport
                .totalValue)).toBeCloseTo(596800, 2);
            const laptop = stockReport.products
                .find((item) => item.name ===
                names.laptop);
            const keyboard = stockReport.products
                .find((item) => item.name ===
                names.keyboard);
            expect(laptop, 'Laptop missing from stock report.').toBeTruthy();
            expect(keyboard, 'Keyboard missing from stock report.').toBeTruthy();
            expect(Number(laptop.quantity)).toBeCloseTo(11, 4);
            expect(Number(laptop.unitCost)).toBeCloseTo(53800, 2);
            expect(Number(laptop.totalValue)).toBeCloseTo(591800, 2);
            expect(Number(keyboard.quantity)).toBeCloseTo(10, 4);
            expect(Number(keyboard.unitCost)).toBeCloseTo(500, 2);
            expect(Number(keyboard.totalValue)).toBeCloseTo(5000, 2);
            await page.goto('/reports/trial-balance');
            await expect(page
                .locator('main')
                .first()).toContainText('Trial Balance');
            await expect(page.locator('input[type="date"]')).toHaveValue(today);
            const inventoryRow = page
                .getByRole('row')
                .filter({
                hasText: 'Stock in Hand Ledger',
            });
            await expect(inventoryRow).toContainText('1,318,400.00');
            await expect(inventoryRow).toContainText('721,600.00');
            await page.goto('/reports/income-statement');
            const incomeMain = page
                .locator('main')
                .first();
            await expect(incomeMain).toContainText('Gross Sales');
            await expect(incomeMain).toContainText('760,000.00');
            await expect(incomeMain).toContainText('Sales Return');
            await expect(incomeMain).toContainText('60,000.00');
            await expect(incomeMain).toContainText('Net Sales');
            await expect(incomeMain).toContainText('700,000.00');
            await expect(incomeMain).toContainText('Gross Cost of Sales');
            await expect(incomeMain).toContainText('621,600.00');
            await expect(incomeMain).toContainText('51,400.00');
            await expect(incomeMain).toContainText('570,200.00');
            await expect(incomeMain).toContainText('129,800.00');
            await page.goto('/reports/balance-sheet');
            const balanceMain = page
                .locator('main')
                .first();
            await expect(balanceMain).toContainText('Balance Sheet');
            await expect(balanceMain).toContainText('Current Profit / Loss');
            await expect(balanceMain).toContainText('129,800.00');
            await expect(balanceMain).toContainText('1,146,800.00');
            await expect(balanceMain).toContainText('1,017,000.00');
            await page.goto('/reports/stock-report');
            const stockMain = page
                .locator('main')
                .first();
            await expect(stockMain).toContainText(names.laptop);
            await expect(stockMain).toContainText(names.keyboard);
            await expect(stockMain).toContainText('591,800.00');
            await expect(stockMain).toContainText('5,000.00');
            await expect(stockMain).toContainText('596,800.00');
            await page.screenshot({
                path: path.join(qaDir, 'workbook-ui-final.png'),
                fullPage: true,
            });
        });
    }
    finally {
        const passedSteps = evidence.filter((item) => item.status ===
            'PASS').length;
        const failedSteps = evidence.filter((item) => item.status ===
            'FAIL').length;
        const result = {
            company_id: companyId,
            warehouse_id: warehouseId,
            email: e2eEmail,
            total_expected_steps: 20,
            passed_steps: passedSteps,
            failed_steps: failedSteps,
            completed: passedSteps ===
                20 &&
                failedSteps ===
                    0,
            steps: evidence,
            executed_at: new Date()
                .toISOString(),
        };
        fs.writeFileSync(path.join(qaDir, 'workbook-ui-results.json'), JSON.stringify(result, null, 2), 'utf8');
    }
});
