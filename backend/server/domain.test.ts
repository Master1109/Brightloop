import {test} from 'node:test';
import assert from 'node:assert/strict';
import {totals,nextPeriod,transitions} from './domain';
test('money is rounded in minor units and tax follows discount',()=>assert.deepEqual(totals(19.99,3,18,10),{subtotal:59.97,discount:10,tax:8.99,total:58.96}));
test('discount cannot produce a negative invoice',()=>assert.equal(totals(10,1,18,100).total,0));
test('invalid quantities are rejected',()=>assert.throws(()=>totals(10,0,18)));
test('month-end anchors survive February',()=>{assert.equal(nextPeriod('2026-01-31','Monthly',31),'2026-02-28');assert.equal(nextPeriod('2026-02-28','Monthly',31),'2026-03-31');});
test('yearly leap dates are clamped',()=>assert.equal(nextPeriod('2024-02-29','Yearly',29),'2025-02-28'));
test('draft cannot activate without confirmation',()=>assert.ok(!transitions.Draft.includes('Active')));
