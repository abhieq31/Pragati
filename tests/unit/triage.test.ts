/**
 * Unit tests for the QA deviation triage classifier — a pharma-critical, rule
 * based (never-LLM) scorer. These pin the severity/category contract and the
 * lexical-similarity search so the playbook stays auditable and regressions
 * in the keyword/weight tables are caught immediately.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyCategory,
  scoreSeverity,
  severityFromScore,
  tokenize,
  bagOfWords,
  cosine,
  findSimilar,
  runTriage,
  type KnownTask,
} from '../../src/lib/ai/triage';

describe('classifyCategory', () => {
  it('matches data integrity language', () => {
    assert.equal(classifyCategory('Found a shared login account used to backdate entries').key, 'data_integrity');
  });

  it('matches CSV / validation language', () => {
    assert.equal(classifyCategory('OQ script failed, requirement not tested per the traceability matrix').key, 'csv_validation');
  });

  it('matches lab informatics language', () => {
    assert.equal(classifyCategory('HPLC chromatography re-integration changed the sample result').key, 'lab_informatics');
  });

  it('falls back to general when nothing matches', () => {
    assert.equal(classifyCategory('The coffee machine on the third floor is broken').key, 'general');
  });

  it('picks the category with the most keyword hits, not just the first match', () => {
    // Two lab-informatics keywords vs. one training keyword — informatics wins.
    const text = 'LIMS chromatography review also flagged a training gap';
    assert.equal(classifyCategory(text).key, 'lab_informatics');
  });
});

describe('scoreSeverity', () => {
  it('scores zero with no severity language', () => {
    const { score, hits } = scoreSeverity('Routine update to the project plan.');
    assert.equal(score, 0);
    assert.equal(hits.length, 0);
  });

  it('accumulates weight across multiple independent signals', () => {
    const { score, hits } = scoreSeverity('Patient safety harm reported; batches affected and a recall is possible.');
    // patient/safety (6) + batches affected (4) + recall (5) = 15
    assert.equal(score, 15);
    assert.equal(hits.length, 3);
  });

  it('lets de-escalating language pull the score negative', () => {
    const { score } = scoreSeverity('Just a typo in a single record, sandbox environment only.');
    assert.ok(score < 0);
  });

  it('is case-insensitive', () => {
    const a = scoreSeverity('RECALL initiated for affected lots');
    const b = scoreSeverity('recall initiated for affected lots');
    assert.equal(a.score, b.score);
  });
});

describe('severityFromScore', () => {
  it('classifies the documented thresholds', () => {
    assert.equal(severityFromScore(0), 'minor');
    assert.equal(severityFromScore(1.9), 'minor');
    assert.equal(severityFromScore(2), 'major');
    assert.equal(severityFromScore(4.9), 'major');
    assert.equal(severityFromScore(5), 'critical');
    assert.equal(severityFromScore(20), 'critical');
  });

  it('treats a negative score as minor, never below it', () => {
    assert.equal(severityFromScore(-5), 'minor');
  });
});

describe('tokenize', () => {
  it('lowercases, strips punctuation, and drops stop words / short tokens', () => {
    // "the", "was", "and", "were" are stop words; "ids" survives (len > 2).
    assert.deepEqual(tokenize('The Audit-Trail was Disabled, and IDs were re-used.'), [
      'audit-trail',
      'disabled',
      'ids',
      're-used',
    ]);
  });

  it('returns an empty array for only stop words', () => {
    assert.deepEqual(tokenize('the a an of in to'), []);
  });
});

describe('cosine', () => {
  it('returns 1 for identical bags', () => {
    const bag = bagOfWords(tokenize('audit trail review process'));
    assert.equal(cosine(bag, bag), 1);
  });

  it('returns 0 for disjoint bags', () => {
    const a = bagOfWords(tokenize('audit trail review'));
    const b = bagOfWords(tokenize('chromatography sample result'));
    assert.equal(cosine(a, b), 0);
  });

  it('returns 0 when either bag is empty', () => {
    const a = bagOfWords(tokenize('audit trail review'));
    const empty = bagOfWords([]);
    assert.equal(cosine(a, empty), 0);
    assert.equal(cosine(empty, a), 0);
  });
});

describe('findSimilar', () => {
  const corpus: KnownTask[] = [
    { _id: '1', title: 'Audit trail gap on batch release records', description: 'Missing entries found during review' },
    { _id: '2', title: 'HPLC chromatography re-integration without justification', description: 'Lab informatics finding' },
    { _id: '3', title: 'Coffee machine repair request', description: 'Third floor break room' },
  ];

  it('ranks lexically closer tasks first', () => {
    const results = findSimilar('Audit trail review found missing entries on batch records', corpus);
    assert.ok(results.length >= 1);
    assert.equal(results[0].task._id, '1');
  });

  it('excludes tasks below the similarity floor', () => {
    const results = findSimilar('Audit trail review found missing entries on batch records', corpus);
    assert.ok(!results.some((r) => r.task._id === '3'));
  });

  it('caps results at k', () => {
    const bigCorpus: KnownTask[] = Array.from({ length: 10 }, (_, i) => ({
      _id: String(i),
      title: 'Audit trail review missing entries batch records',
    }));
    assert.equal(findSimilar('Audit trail review missing entries batch records', bigCorpus, 3).length, 3);
  });
});

describe('runTriage', () => {
  it('produces a consistent end-to-end critical result with rationale and CAPA', () => {
    const result = runTriage(
      'Patient safety harm from recall-triggering batch issue',
      'Multiple batches affected; FDA inspector flagged it during the audit.',
      [],
    );
    assert.equal(result.severity, 'critical');
    assert.ok(result.severityScore >= 5);
    assert.ok(result.rationale.length > 0);
    assert.ok(result.suggestedCapa.length > 0);
    assert.ok(result.suggestedCapa.length <= 5);
    assert.equal(result.similarTaskIds.length, 0);
    assert.ok(!isNaN(new Date(result.computedAt).getTime()));
  });

  it('defaults to minor with an explanatory rationale when nothing matches', () => {
    const result = runTriage('Update the team wiki', 'Just a documentation tidy-up.', []);
    assert.equal(result.severity, 'minor');
    assert.ok(result.rationale.some((r) => r.includes('defaulted to minor')));
  });

  it('is deterministic for the same input', () => {
    const a = runTriage('Shared login used for raw data entry', 'ALCOA+ concern raised by QA', []);
    const b = runTriage('Shared login used for raw data entry', 'ALCOA+ concern raised by QA', []);
    assert.equal(a.severity, b.severity);
    assert.equal(a.severityScore, b.severityScore);
    assert.equal(a.category, b.category);
  });

  it('surfaces similar prior tasks from the corpus', () => {
    const corpus: KnownTask[] = [
      { _id: 'a1', title: 'Shared login account used for raw data entry', projectCode: 'QA-100' },
    ];
    const result = runTriage('Shared login used for raw data entry again', 'ALCOA+ concern', corpus);
    assert.equal(result.similarTaskIds.length, 1);
    assert.equal(result.similar[0].projectCode, 'QA-100');
  });
});
