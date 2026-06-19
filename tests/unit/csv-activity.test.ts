/**
 * Unit tests for the CSV Activity tracker's pure helpers — stage
 * normalization, row completion, and approval-date parsing. No DB calls.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CSV_STAGE_KEYS,
  emptyStageCells,
  normalizeStageCells,
  rowCompletion,
} from '../../src/lib/csvStages';
import { parseApprovalDate, normalizeRows } from '../../src/lib/csvActivity';

describe('normalizeStageCells', () => {
  it('always returns the six canonical stages in order', () => {
    const cells = normalizeStageCells([]);
    assert.deepEqual(
      cells.map((c) => c.key),
      [...CSV_STAGE_KEYS],
    );
  });

  it('fills missing stages and preserves provided ones', () => {
    const cells = normalizeStageCells([{ key: 'oq', docNo: 'OQ-1', status: 'done' }]);
    const oq = cells.find((c) => c.key === 'oq')!;
    assert.equal(oq.docNo, 'OQ-1');
    assert.equal(oq.status, 'done');
    const cs = cells.find((c) => c.key === 'cs')!;
    assert.equal(cs.status, 'pending');
    assert.equal(cs.docNo, '');
  });

  it('drops unknown keys and coerces bad statuses to pending', () => {
    const cells = normalizeStageCells([
      { key: 'nope' as any, docNo: 'x', status: 'done' },
      { key: 'vsr', status: 'weird' as any },
    ]);
    assert.equal(cells.length, 6);
    assert.ok(!cells.some((c) => c.key === ('nope' as any)));
    assert.equal(cells.find((c) => c.key === 'vsr')!.status, 'pending');
  });
});

describe('rowCompletion', () => {
  it('is 100% for a fresh row with no applicable work? no — all pending = 0%', () => {
    assert.equal(rowCompletion(emptyStageCells()), 0);
  });

  it('excludes NA stages from the denominator', () => {
    // 1 done, 1 pending, 4 NA → 1/2 applicable = 50%
    const cells = normalizeStageCells([
      { key: 'cs', status: 'done' },
      { key: 'cdd_val', status: 'pending' },
      { key: 'oq', status: 'na' },
      { key: 'cdd_prod', status: 'na' },
      { key: 'vsr', status: 'na' },
      { key: 'shf', status: 'na' },
    ]);
    assert.equal(rowCompletion(cells), 50);
  });

  it('is 100% when every applicable stage is done', () => {
    const cells = normalizeStageCells(
      CSV_STAGE_KEYS.map((key) => ({ key, status: 'done' as const })),
    );
    assert.equal(rowCompletion(cells), 100);
  });
});

describe('parseApprovalDate', () => {
  it('parses dd/mm/yyyy as a local date', () => {
    const d = parseApprovalDate('23/04/2026')!;
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 3); // April (0-based)
    assert.equal(d.getDate(), 23);
  });

  it('returns null for empty / invalid input', () => {
    assert.equal(parseApprovalDate(''), null);
    assert.equal(parseApprovalDate(null), null);
    assert.equal(parseApprovalDate('not a date'), null);
  });
});

describe('normalizeRows', () => {
  it('parses dates and rectangularizes stages', () => {
    const rows = normalizeRows([
      { formatNumber: 'F4', stages: [{ key: 'cs', docNo: 'D1', approvalDate: '12/05/2026', status: 'done' }] },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].stages.length, 6);
    const cs = rows[0].stages.find((s) => s.key === 'cs')!;
    assert.ok(cs.approvalDate instanceof Date);
    assert.equal(cs.status, 'done');
  });
});
