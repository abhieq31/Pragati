/**
 * Unit tests for the Quality Signal engine.
 *
 * Tests the pure-math layer — clustering and similarity — without any DB
 * calls. The similarity math is imported directly from triage.ts (same
 * functions the production engine uses) so there is a single source of truth
 * for the algorithm.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tokenize, bagOfWords, cosine } from '../../src/lib/ai/triage';

// ── tokenize ──────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('lowercases and strips punctuation', () => {
    const tokens = tokenize('Audit Trail DISABLED! Backdated entry.');
    assert.ok(tokens.includes('audit'));
    assert.ok(tokens.includes('trail'));
    assert.ok(tokens.includes('disabled'));
    assert.ok(tokens.includes('backdated'));
    assert.ok(tokens.includes('entry'));
  });

  it('removes stop words', () => {
    const tokens = tokenize('the audit trail was disabled');
    assert.ok(!tokens.includes('the'));
    assert.ok(!tokens.includes('was'));
    assert.ok(tokens.includes('audit'));
  });

  it('filters tokens shorter than 3 characters', () => {
    const tokens = tokenize('OQ IQ PQ test');
    // 'OQ', 'IQ', 'PQ' are 2 chars — but triage.ts uses > 2 so length >= 3
    // Actually in triage.ts: filter t.length > 2 means >= 3
    // 'oq', 'iq', 'pq' are 2 chars so filtered
    assert.ok(!tokens.includes('oq'));
    assert.ok(!tokens.includes('iq'));
    assert.ok(!tokens.includes('pq'));
    assert.ok(tokens.includes('test'));
  });

  it('returns empty for blank input', () => {
    assert.deepEqual(tokenize(''), []);
    assert.deepEqual(tokenize('   '), []);
  });
});

// ── cosine similarity ─────────────────────────────────────────────────────────

describe('cosine similarity', () => {
  it('returns 1.0 for identical vectors', () => {
    const v = bagOfWords(tokenize('audit trail disabled shared login'));
    const sim = cosine(v, v);
    assert.ok(sim > 0.99, `expected ~1.0, got ${sim}`);
  });

  it('returns 0 for completely disjoint vectors', () => {
    const v1 = bagOfWords(tokenize('chromatography hplc injection sequence'));
    const v2 = bagOfWords(tokenize('training competency qualified person'));
    const sim = cosine(v1, v2);
    assert.equal(sim, 0);
  });

  it('returns 0 for empty vectors', () => {
    const empty = new Map<string, number>();
    assert.equal(cosine(empty, bagOfWords(tokenize('audit trail'))), 0);
    assert.equal(cosine(bagOfWords(tokenize('audit trail')), empty), 0);
  });

  it('gives higher similarity to more overlapping texts', () => {
    const base = bagOfWords(tokenize('HPLC chromatography audit trail disabled'));
    const related = bagOfWords(tokenize('HPLC chromatography instrument failure'));
    const unrelated = bagOfWords(tokenize('training competency SOP qualification'));
    assert.ok(cosine(base, related) > cosine(base, unrelated));
  });

  it('is commutative', () => {
    const v1 = bagOfWords(tokenize('batch released audit trail missing'));
    const v2 = bagOfWords(tokenize('batch impacted audit trail review'));
    const diff = Math.abs(cosine(v1, v2) - cosine(v2, v1));
    assert.ok(diff < 1e-10, `not commutative: diff=${diff}`);
  });
});
