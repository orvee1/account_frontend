import test from 'node:test';
import assert from 'node:assert/strict';
import formatVendorForDisplay from './formatVendorForDisplay.js';

test('does not use opening balance as the list balance when there is no transaction balance', () => {
  const vendor = {
    id: 42,
    name: 'ABC Corporation',
    openingBalance: 1250,
    opening_balance: 1250,
  };

  const formatted = formatVendorForDisplay(vendor);

  assert.equal(formatted.balance, 0);
  assert.equal(formatted.balanceFormatted, '0.00');
});

test('uses an explicit balance when one is provided', () => {
  const vendor = {
    id: 42,
    name: 'ABC Corporation',
    balance: 375.5,
    openingBalance: 1250,
  };

  const formatted = formatVendorForDisplay(vendor);

  assert.equal(formatted.balance, 375.5);
  assert.equal(formatted.balanceFormatted, '375.50');
});
