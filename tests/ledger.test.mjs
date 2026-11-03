import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, monthlySummary } from '../src/ledger.mjs';
const entry = { type: 'expense', amount: 500, date: '2026-02-28', category: '食費' };
test('不正な金額や日付を拒否する', () => {
  for (const amount of [0, -1, 1.5, NaN]) assert.throws(() => validateEntry({ ...entry, amount }));
  assert.throws(() => validateEntry({ ...entry, date: '2026-02-30' }));
  assert.throws(() => validateEntry({ ...entry, category: ' ' }));
});
test('対象月の収支と支出内訳を集計する', () => {
  const r = monthlySummary([entry, { ...entry, amount: 300 }, { ...entry, type: 'income', amount: 2000 }, { ...entry, date: '2026-03-01' }], '2026-02');
  assert.equal(r.income, 2000); assert.equal(r.expense, 800); assert.equal(r.balance, 1200); assert.equal(r.categories['食費'], 800);
});
