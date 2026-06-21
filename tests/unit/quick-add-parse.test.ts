/**
 * Unit tests for the quick-add free-text parser — a small, deterministic
 * rule set (never an LLM) that pulls a due date and priority out of one line
 * of typed text for the command palette's "Quick add task" action.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseQuickAdd } from '../../src/lib/quickAddParse';

// Wednesday, 2026-06-17 — a fixed reference so weekday/relative math is stable.
const NOW = new Date(2026, 5, 17, 9, 0, 0);

describe('parseQuickAdd — plain text', () => {
  it('returns the trimmed text untouched with no date/priority signal', () => {
    const r = parseQuickAdd('  Renew the SSL certificate  ', NOW);
    assert.equal(r.title, 'Renew the SSL certificate');
    assert.equal(r.priority, undefined);
    assert.equal(r.dueDate, undefined);
  });
});

describe('parseQuickAdd — relative dates', () => {
  it('today / tonight → today', () => {
    assert.equal(parseQuickAdd('Ship the report today', NOW).dueDate, '2026-06-17');
    assert.equal(parseQuickAdd('Call back tonight', NOW).dueDate, '2026-06-17');
  });

  it('tomorrow / tmrw → +1 day', () => {
    assert.equal(parseQuickAdd('Follow up tomorrow', NOW).dueDate, '2026-06-18');
    assert.equal(parseQuickAdd('Follow up tmrw', NOW).dueDate, '2026-06-18');
  });

  it('in N day(s) / week(s)', () => {
    assert.equal(parseQuickAdd('Renew badge in 3 days', NOW).dueDate, '2026-06-20');
    assert.equal(parseQuickAdd('Audit recheck in 1 week', NOW).dueDate, '2026-06-24');
    assert.equal(parseQuickAdd('Long lead item in 2 weeks', NOW).dueDate, '2026-07-01');
  });

  it('next week → +7 days', () => {
    assert.equal(parseQuickAdd('Plan the offsite next week', NOW).dueDate, '2026-06-24');
  });
});

describe('parseQuickAdd — weekdays', () => {
  it('a bare weekday is the nearest occurrence, today counts', () => {
    // NOW is itself a Wednesday.
    assert.equal(parseQuickAdd('Ship it wednesday', NOW).dueDate, '2026-06-17');
    assert.equal(parseQuickAdd('Ship it friday', NOW).dueDate, '2026-06-19');
    // Sunday is earlier in the week index than Wednesday — wraps to next week.
    assert.equal(parseQuickAdd('Ship it sunday', NOW).dueDate, '2026-06-21');
  });

  it('"next <weekday>" skips today\'s own occurrence but not a later one this week', () => {
    // Said on a Wednesday: "next wednesday" must NOT mean today.
    assert.equal(parseQuickAdd('Recheck next wednesday', NOW).dueDate, '2026-06-24');
    // "next friday" this week still resolves to the nearer Friday (2 days out).
    assert.equal(parseQuickAdd('Recheck next friday', NOW).dueDate, '2026-06-19');
  });

  it('accepts common abbreviations', () => {
    assert.equal(parseQuickAdd('Standup fri', NOW).dueDate, '2026-06-19');
    assert.equal(parseQuickAdd('Standup mon', NOW).dueDate, '2026-06-22');
  });
});

describe('parseQuickAdd — explicit dates', () => {
  it('M/D defaults to the current year', () => {
    assert.equal(parseQuickAdd('Renew lease 7/4', NOW).dueDate, '2026-07-04');
  });

  it('M/D/YYYY and M/D/YY both work', () => {
    assert.equal(parseQuickAdd('File taxes 4/15/2027', NOW).dueDate, '2027-04-15');
    assert.equal(parseQuickAdd('File taxes 4/15/27', NOW).dueDate, '2027-04-15');
  });

  it('ISO yyyy-mm-dd', () => {
    assert.equal(parseQuickAdd('Go live 2026-08-01', NOW).dueDate, '2026-08-01');
  });
});

describe('parseQuickAdd — priority', () => {
  it('trailing "!!" is high, "!!!" is critical', () => {
    assert.equal(parseQuickAdd('Patch the server !!', NOW).priority, 'high');
    assert.equal(parseQuickAdd('Patch the server !!!', NOW).priority, 'critical');
  });

  it('a single trailing "!" is left alone — too common to be a signal', () => {
    assert.equal(parseQuickAdd('Great job today!', NOW).priority, undefined);
  });

  it('matches urgent/critical/asap as critical', () => {
    assert.equal(parseQuickAdd('asap fix the build', NOW).priority, 'critical');
    assert.equal(parseQuickAdd('This is urgent', NOW).priority, 'critical');
  });

  it('matches high/low priority phrases', () => {
    assert.equal(parseQuickAdd('high priority deploy', NOW).priority, 'high');
    assert.equal(parseQuickAdd('low priority cleanup', NOW).priority, 'low');
    assert.equal(parseQuickAdd('Reorganize the wiki whenever', NOW).priority, 'low');
  });

  it('strips the matched marker out of the title', () => {
    assert.equal(parseQuickAdd('Patch the server !!!', NOW).title, 'Patch the server');
    assert.equal(parseQuickAdd('asap fix the build', NOW).title, 'fix the build');
  });
});

describe('parseQuickAdd — combined signals', () => {
  it('extracts both a due date and a priority, leaving a clean title', () => {
    const r = parseQuickAdd('Renew SSL cert urgent tomorrow', NOW);
    assert.equal(r.title, 'Renew SSL cert');
    assert.equal(r.priority, 'critical');
    assert.equal(r.dueDate, '2026-06-18');
    assert.ok(r.dueLabel && r.dueLabel.length > 0);
  });

  it('is deterministic for the same input and now', () => {
    const a = parseQuickAdd('Ship the report friday !!', NOW);
    const b = parseQuickAdd('Ship the report friday !!', NOW);
    assert.deepEqual(a, b);
  });
});

describe('parseQuickAdd — edge cases', () => {
  it('falls back to the original text if stripping would leave nothing', () => {
    const r = parseQuickAdd('tomorrow !!!', NOW);
    assert.equal(r.title, 'tomorrow !!!');
  });

  it('handles an empty string without throwing', () => {
    const r = parseQuickAdd('   ', NOW);
    assert.equal(r.title, '');
    assert.equal(r.dueDate, undefined);
  });
});
