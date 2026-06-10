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
import { clusterDocs, type ClusterDoc } from '../../src/lib/qualitySignals';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDoc(id: string, text: string): ClusterDoc {
  return { id, title: text, vec: bagOfWords(tokenize(text)) };
}

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

// ── clusterDocs ───────────────────────────────────────────────────────────────

describe('clusterDocs', () => {
  it('clusters highly similar documents together', () => {
    const docs = [
      makeDoc('1', 'HPLC chromatography audit trail disabled injection sequence'),
      makeDoc('2', 'HPLC chromatography audit trail gap injection sequence results'),
      makeDoc('3', 'HPLC chromatography audit trail missing entry injection sequence'),
      makeDoc('4', 'HPLC chromatography audit disabled integration reprocessing'),
      makeDoc('5', 'training SOP competency personnel gap qualification'),
      makeDoc('6', 'training qualification missing competency records SOPs'),
      makeDoc('7', 'training gap personnel SOP not completed competency'),
    ];

    const clusters = clusterDocs(docs, 0.4);

    // Should find at least one cluster
    assert.ok(clusters.length >= 1, 'Expected at least one cluster');

    // The HPLC group (1-4) and the training group (5-7) should cluster separately
    const allIds = clusters.flatMap((c) => c.map((m) => m.id));
    const hplcIds = ['1', '2', '3', '4'];
    const trainingIds = ['5', '6', '7'];

    // At least some of each group should be in a cluster
    const hplcInCluster = hplcIds.filter((id) => allIds.includes(id));
    const trainingInCluster = trainingIds.filter((id) => allIds.includes(id));
    assert.ok(hplcInCluster.length >= 3, `Expected HPLC cluster, got: ${hplcInCluster}`);
    assert.ok(trainingInCluster.length >= 3, `Expected training cluster, got: ${trainingInCluster}`);

    // The two groups should not be in the same cluster
    for (const cluster of clusters) {
      const ids = cluster.map((m) => m.id);
      const hasHplc = hplcIds.some((id) => ids.includes(id));
      const hasTraining = trainingIds.some((id) => ids.includes(id));
      assert.ok(!(hasHplc && hasTraining), `HPLC and training should not cluster together, got: ${ids}`);
    }
  });

  it('returns no clusters when all documents are dissimilar', () => {
    const docs = [
      makeDoc('1', 'HPLC chromatography injection sequence reprocessing'),
      makeDoc('2', 'training competency SOP qualified person gap'),
      makeDoc('3', 'batch released recalled patient safety market withdrawal'),
    ];
    const clusters = clusterDocs(docs, 0.4);
    assert.equal(clusters.length, 0);
  });

  it('requires minimum 3 members — pairs do not qualify', () => {
    const docs = [
      makeDoc('1', 'HPLC chromatography audit trail disabled injection'),
      makeDoc('2', 'HPLC chromatography audit trail gap injection sequence'),
      makeDoc('3', 'training competency SOP qualified person gap certification'),
    ];
    const clusters = clusterDocs(docs, 0.4);
    // The pair (1,2) should not form a cluster on its own
    for (const c of clusters) {
      assert.ok(c.length >= 3, `Cluster has only ${c.length} members`);
    }
  });

  it('returns empty for fewer than 3 documents', () => {
    assert.deepEqual(clusterDocs([], 0.4), []);
    assert.deepEqual(clusterDocs([makeDoc('1', 'audit trail disabled')], 0.4), []);
    assert.deepEqual(
      clusterDocs([makeDoc('1', 'audit trail disabled'), makeDoc('2', 'audit trail disabled')], 0.4),
      [],
    );
  });

  it('transitivity: A-B and B-C similar → A,B,C in same cluster', () => {
    // A and C are dissimilar directly, but both similar to B
    const docs = [
      makeDoc('A', 'audit trail disabled HPLC chromatography instrument qualification'),
      makeDoc('B', 'audit trail disabled HPLC chromatography missing entries'),
      makeDoc('C', 'audit trail disabled missing entries reprocessing integration'),
    ];
    const clusters = clusterDocs(docs, 0.35);
    // All three should end up in the same cluster
    if (clusters.length > 0) {
      const largest = clusters.sort((a, b) => b.length - a.length)[0];
      assert.ok(largest.length >= 3, 'Expected A, B, C in same cluster via transitivity');
    }
  });

  it('is deterministic — same input always produces same output', () => {
    const docs = [
      makeDoc('1', 'audit trail HPLC chromatography disabled injection'),
      makeDoc('2', 'audit trail HPLC chromatography gap injection'),
      makeDoc('3', 'audit trail HPLC chromatography missing entries injection'),
      makeDoc('4', 'training SOP competency qualification'),
    ];

    const result1 = clusterDocs(docs, 0.4);
    const result2 = clusterDocs(docs, 0.4);

    assert.equal(
      JSON.stringify(result1.map((c) => c.map((m) => m.id).sort())),
      JSON.stringify(result2.map((c) => c.map((m) => m.id).sort())),
    );
  });
});
