/**
 * Unit tests for the momentum streak/window calculation.
 *
 * `computeMomentum` is the pure core of `momentumStats` (which adds the DB
 * read) — day-bucketing and streak semantics live entirely here, so they're
 * tested without a database.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeMomentum } from '../../src/lib/momentum';

const DAY = 86_400_000;
const NOW = new Date('2026-06-10T15:00:00.000Z');
const daysAgo = (n: number) => new Date(+NOW - n * DAY);

describe('computeMomentum', () => {
  it('returns all zeros for no completions', () => {
    assert.deepEqual(computeMomentum([], NOW), { streak: 0, doneToday: 0, doneThisWeek: 0 });
  });

  it('ignores null/undefined/unparseable entries', () => {
    const stats = computeMomentum([null, undefined, 'not-a-date', daysAgo(0)], NOW);
    assert.equal(stats.doneToday, 1);
  });

  it('counts multiple completions on the same day once toward the streak but all toward doneToday', () => {
    const stats = computeMomentum([daysAgo(0), daysAgo(0), daysAgo(0)], NOW);
    assert.equal(stats.doneToday, 3);
    assert.equal(stats.streak, 1);
  });

  it('builds a streak across consecutive active days ending today', () => {
    const stats = computeMomentum([daysAgo(0), daysAgo(1), daysAgo(2)], NOW);
    assert.equal(stats.streak, 3);
  });

  it('a gap older than today breaks the streak', () => {
    const stats = computeMomentum([daysAgo(0), daysAgo(1), daysAgo(3)], NOW); // gap at day 2
    assert.equal(stats.streak, 2);
  });

  it('an empty today does not break a streak that ended yesterday', () => {
    const stats = computeMomentum([daysAgo(1), daysAgo(2)], NOW); // nothing today yet
    assert.equal(stats.streak, 2);
  });

  it('a gap right after today (no completion at all) yields a zero streak', () => {
    const stats = computeMomentum([daysAgo(2), daysAgo(3)], NOW); // yesterday is empty too
    assert.equal(stats.streak, 0);
  });

  it('doneThisWeek covers a rolling 7-day window, not calendar week', () => {
    const stats = computeMomentum([daysAgo(0), daysAgo(6), daysAgo(8)], NOW);
    assert.equal(stats.doneThisWeek, 2);
  });

  it('is deterministic for the same input', () => {
    const input = [daysAgo(0), daysAgo(1), daysAgo(5)];
    assert.deepEqual(computeMomentum(input, NOW), computeMomentum(input, NOW));
  });
});
