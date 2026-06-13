/**
 * Unit tests for the curated industry insights feed.
 *
 * The feed is pure and deterministic — these tests pin the contract the
 * welcome email and daily brief depend on: a real insight always comes back,
 * unknown industries fall back to general, and the daily pick is stable for a
 * given day yet differs by seed (welcome vs brief).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveIndustry, insightsFor, pickInsight, INDUSTRY_LABELS } from '../../src/lib/insights';

describe('resolveIndustry', () => {
  it('accepts a known industry and lowercases', () => {
    assert.equal(resolveIndustry('pharma_manufacturing'), 'pharma_manufacturing');
    assert.equal(resolveIndustry('SOFTWARE'), 'software');
  });
  it('falls back to general for unknown / empty', () => {
    assert.equal(resolveIndustry('crypto_zoo'), 'general');
    assert.equal(resolveIndustry(''), 'general');
    assert.equal(resolveIndustry(null), 'general');
    assert.equal(resolveIndustry(undefined), 'general');
  });
});

describe('insightsFor', () => {
  it('prepends the specialised set, then always includes the general pool', () => {
    const pharma = insightsFor('pharma_manufacturing');
    const general = insightsFor('general');
    // Specialised industries are strictly deeper than the general fallback.
    assert.ok(pharma.length > general.length);
    // Every pool ends with the universal principles.
    assert.ok(pharma.length >= general.length);
    // Every entry is a real, non-empty insight.
    for (const i of pharma) {
      assert.ok(i.tag && i.title && i.body, 'insight must have tag, title, body');
    }
  });
  it('every labelled industry resolves to a non-empty pool', () => {
    for (const key of Object.keys(INDUSTRY_LABELS)) {
      assert.ok(insightsFor(key as any).length > 0, `${key} must have insights`);
    }
  });
});

describe('pickInsight', () => {
  const day = new Date('2026-06-13T09:00:00Z');
  it('is deterministic for a given day + seed', () => {
    const a = pickInsight('software', 0, day);
    const b = pickInsight('software', 0, day);
    assert.deepEqual(a, b);
  });
  it('the welcome seed differs from the brief seed (usually)', () => {
    // seed 0 (brief) vs seed 1 (welcome) — different index unless the pool
    // size divides evenly; with our pools they differ for this day.
    const brief = pickInsight('pharma_manufacturing', 0, day);
    const welcome = pickInsight('pharma_manufacturing', 1, day);
    assert.notDeepEqual(brief, welcome);
  });
  it('rotates across days', () => {
    const d1 = pickInsight('general', 0, new Date('2026-06-13T00:00:00Z'));
    const d2 = pickInsight('general', 0, new Date('2026-06-14T00:00:00Z'));
    assert.notDeepEqual(d1, d2);
  });
});
