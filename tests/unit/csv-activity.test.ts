/**
 * Unit tests for the tracker's pure helpers — stage normalization, row
 * completion, stage-def resolution, and date parsing. No DB calls.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_STAGES,
  LEGACY_STAGES,
  emptyStageCells,
  normalizeStageCells,
  rowCompletion,
  sheetStages,
} from '../../src/lib/csvStages';
import { parseStageDate, normalizeRows, normalizeStageDefs } from '../../src/lib/csvActivity';

const DEFS = [...DEFAULT_STAGES];

describe('sheetStages', () => {
  it('falls back to the legacy layout when no stages are stored', () => {
    assert.deepEqual(
      sheetStages(undefined).map((s) => s.key),
      LEGACY_STAGES.map((s) => s.key),
    );
  });

  it('keeps stored stages and dedupes by key', () => {
    const defs = sheetStages([
      { key: 'a', label: 'Alpha' },
      { key: 'a', label: 'dupe' },
      { key: 'b', label: 'Beta' },
    ]);
    assert.deepEqual(
      defs.map((s) => s.key),
      ['a', 'b'],
    );
    assert.equal(defs[0].label, 'Alpha');
  });

  it('defaults a missing label to the key', () => {
    const defs = sheetStages([{ key: 'x' }]);
    assert.equal(defs[0].label, 'x');
  });
});

describe('normalizeStageDefs', () => {
  it('returns the default stages when given nothing', () => {
    assert.deepEqual(
      normalizeStageDefs(undefined).map((s) => s.key),
      DEFAULT_STAGES.map((s) => s.key),
    );
  });
});

describe('normalizeStageCells', () => {
  it('returns one cell per def, in order', () => {
    const cells = normalizeStageCells([], DEFS);
    assert.deepEqual(
      cells.map((c) => c.key),
      DEFS.map((d) => d.key),
    );
  });

  it('fills missing stages and preserves provided ones', () => {
    const cells = normalizeStageCells([{ key: 'review', ref: 'R-1', status: 'done' }], DEFS);
    const review = cells.find((c) => c.key === 'review')!;
    assert.equal(review.ref, 'R-1');
    assert.equal(review.status, 'done');
    const draft = cells.find((c) => c.key === 'draft')!;
    assert.equal(draft.status, 'pending');
    assert.equal(draft.ref, '');
  });

  it('drops unknown keys and coerces bad statuses to pending', () => {
    const cells = normalizeStageCells(
      [
        { key: 'nope', ref: 'x', status: 'done' },
        { key: 'approval', status: 'weird' as any },
      ],
      DEFS,
    );
    assert.equal(cells.length, DEFS.length);
    assert.ok(!cells.some((c) => c.key === 'nope'));
    assert.equal(cells.find((c) => c.key === 'approval')!.status, 'pending');
  });

  it('reads the legacy docNo/approvalDate field names', () => {
    const cells = normalizeStageCells(
      [{ key: 'draft', docNo: 'OLD-1', approvalDate: '2026-01-01', status: 'done' } as any],
      DEFS,
    );
    const draft = cells.find((c) => c.key === 'draft')!;
    assert.equal(draft.ref, 'OLD-1');
    assert.equal(draft.date, '2026-01-01');
  });
});

describe('rowCompletion', () => {
  it('is 0% for a fresh row (all pending)', () => {
    assert.equal(rowCompletion(emptyStageCells(DEFS)), 0);
  });

  it('excludes NA stages from the denominator', () => {
    // 1 done, 1 pending, 1 NA → 1/2 applicable = 50%
    const cells = normalizeStageCells(
      [
        { key: 'draft', status: 'done' },
        { key: 'review', status: 'pending' },
        { key: 'approval', status: 'na' },
      ],
      DEFS,
    );
    assert.equal(rowCompletion(cells), 50);
  });

  it('is 100% when every applicable stage is done', () => {
    const cells = normalizeStageCells(
      DEFS.map((d) => ({ key: d.key, status: 'done' as const })),
      DEFS,
    );
    assert.equal(rowCompletion(cells), 100);
  });

  it('is 100% when nothing is applicable (all NA)', () => {
    const cells = normalizeStageCells(
      DEFS.map((d) => ({ key: d.key, status: 'na' as const })),
      DEFS,
    );
    assert.equal(rowCompletion(cells), 100);
  });
});

describe('parseStageDate', () => {
  it('parses dd/mm/yyyy as a local date', () => {
    const d = parseStageDate('23/04/2026')!;
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 3); // April (0-based)
    assert.equal(d.getDate(), 23);
  });

  it('returns null for empty / invalid input', () => {
    assert.equal(parseStageDate(''), null);
    assert.equal(parseStageDate(null), null);
    assert.equal(parseStageDate('not a date'), null);
  });
});

describe('normalizeRows', () => {
  it('parses dates and rectangularizes stages against the defs', () => {
    const rows = normalizeRows(
      [{ ref: 'F4', stages: [{ key: 'draft', ref: 'D1', date: '12/05/2026', status: 'done' }] }],
      DEFS,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].stages.length, DEFS.length);
    const draft = rows[0].stages.find((s) => s.key === 'draft')!;
    assert.ok(draft.date instanceof Date);
    assert.equal(draft.status, 'done');
  });

  it('reads legacy row field names (formatNumber/formatTitle/sites)', () => {
    const rows = normalizeRows(
      [{ formatNumber: 'F4', formatTitle: 'Title', sites: 'A1', stages: [] }],
      DEFS,
    );
    assert.equal(rows[0].ref, 'F4');
    assert.equal(rows[0].name, 'Title');
    assert.equal(rows[0].note, 'A1');
  });
});
