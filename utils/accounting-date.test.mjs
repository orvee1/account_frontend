import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDateInput } from './accounting-date.mjs';

test('Dhaka calendar dates do not move to the previous UTC day', () => {
  process.env.TZ = 'Asia/Dhaka';
  assert.equal(toDateInput(new Date('2026-09-11T18:20:00Z')), '2026-09-12');
  assert.equal(toDateInput(new Date(2026, 0, 1)), '2026-01-01');
  assert.equal(toDateInput('2026-09-11T18:00:00.000Z'), '2026-09-12');
  assert.equal(toDateInput('2026-09-12'), '2026-09-12');
  assert.equal(toDateInput(''), '');
});

test('date-only values stay unchanged in a timezone behind UTC', () => {
  process.env.TZ = 'America/Los_Angeles';
  assert.equal(toDateInput('2026-09-12'), '2026-09-12');
  assert.equal(toDateInput(new Date('2026-09-12T01:00:00Z')), '2026-09-11');
});
