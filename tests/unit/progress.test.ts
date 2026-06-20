/**
 * Unit tests for priority-weighted project progress.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { weightedProgress, PRIORITY_WEIGHT } from '../../src/lib/progress';

describe('weightedProgress', () => {
  it('returns 0 for an empty task list', () => {
    assert.equal(weightedProgress([]), 0);
  });

  it('returns 0 when nothing is done', () => {
    assert.equal(
      weightedProgress([
        { status: 'todo', priority: 'high' },
        { status: 'in_progress', priority: 'low' },
      ]),
      0,
    );
  });

  it('returns 100 when everything is done', () => {
    assert.equal(
      weightedProgress([
        { status: 'done', priority: 'critical' },
        { status: 'done', priority: 'low' },
      ]),
      100,
    );
  });

  it('weights critical work above low-priority work', () => {
    // One done critical (w=4) + one open low (w=1): 4 / 5 = 80%.
    const withCriticalDone = weightedProgress([
      { status: 'done', priority: 'critical' },
      { status: 'todo', priority: 'low' },
    ]);
    // Same shape but the LOW task is the one done instead: 1 / 5 = 20%.
    const withLowDone = weightedProgress([
      { status: 'todo', priority: 'critical' },
      { status: 'done', priority: 'low' },
    ]);
    assert.equal(withCriticalDone, 80);
    assert.equal(withLowDone, 20);
    assert.ok(withCriticalDone > withLowDone);
  });

  it('treats a missing/unknown priority as medium weight', () => {
    const withUnknown = weightedProgress([
      { status: 'done', priority: 'made-up' },
      { status: 'todo', priority: 'made-up' },
    ]);
    const withMedium = weightedProgress([
      { status: 'done', priority: 'medium' },
      { status: 'todo', priority: 'medium' },
    ]);
    assert.equal(withUnknown, 50);
    assert.equal(withUnknown, withMedium);
  });

  it('treats a null priority the same as undefined', () => {
    assert.equal(
      weightedProgress([{ status: 'done', priority: null }]),
      weightedProgress([{ status: 'done' }]),
    );
  });

  it('matches the documented weight table', () => {
    assert.deepEqual(PRIORITY_WEIGHT, { critical: 4, high: 3, medium: 2, low: 1 });
  });

  it('rounds to the nearest whole percent', () => {
    // 1 of 3 equal-weight tasks done → 33.33% → rounds to 33.
    assert.equal(
      weightedProgress([
        { status: 'done', priority: 'medium' },
        { status: 'todo', priority: 'medium' },
        { status: 'todo', priority: 'medium' },
      ]),
      33,
    );
  });
});
