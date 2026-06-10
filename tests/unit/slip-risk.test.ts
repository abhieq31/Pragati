/**
 * Unit tests for the slip-risk early-warning model.
 *
 * The model is deliberately deterministic and hand-calibrated, so these
 * tests pin its behavioural contract: when it must stay silent, when it
 * must speak, and that every signal carries a human-readable reason.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDeliveryProfiles, buildOpenLoad, scoreSlipRisk } from '../../src/lib/ai/slipRisk';

const DAY = 86_400_000;
const NOW = new Date('2026-06-10T12:00:00Z');
const daysAgo = (n: number) => new Date(+NOW - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(+NOW + n * DAY).toISOString();

/** A completed task that took `cycle` days and landed `lateBy` days past due. */
function doneTask(assigneeId: string, cycle: number, lateBy: number) {
  const created = daysAgo(30 + cycle);
  const completed = daysAgo(30);
  return {
    assigneeId,
    status: 'done',
    createdAt: created,
    completedAt: completed,
    dueDate: new Date(+new Date(completed) - lateBy * DAY).toISOString(),
  };
}

describe('buildDeliveryProfiles', () => {
  it('learns median cycle and a smoothed late rate per assignee', () => {
    const profiles = buildDeliveryProfiles([
      doneTask('u1', 4, 0),
      doneTask('u1', 6, 2),
      doneTask('u1', 8, 2),
      { assigneeId: 'u2', status: 'todo', createdAt: daysAgo(1) }, // open — ignored
    ]);
    const p = profiles.get('u1')!;
    assert.equal(p.samples, 3);
    assert.equal(p.medianCycleDays, 6);
    // 2 of 3 dated tasks late, Laplace-smoothed: (2+1)/(3+2)
    assert.equal(p.lateRate, 0.6);
    assert.equal(profiles.get('u2'), undefined);
  });
});

describe('scoreSlipRisk — silence contract', () => {
  const profile = { samples: 10, medianCycleDays: 7, lateRate: 0.5 };

  it('stays silent without a due date, when done/blocked, overdue, or far out', () => {
    assert.equal(scoreSlipRisk({ status: 'todo' }, profile, 3, NOW), null);
    assert.equal(scoreSlipRisk({ status: 'done', dueDate: daysAhead(2) }, profile, 3, NOW), null);
    assert.equal(scoreSlipRisk({ status: 'blocked', dueDate: daysAhead(2) }, profile, 3, NOW), null);
    assert.equal(scoreSlipRisk({ status: 'todo', dueDate: daysAgo(1) }, profile, 3, NOW), null);
    assert.equal(scoreSlipRisk({ status: 'todo', dueDate: daysAhead(30) }, profile, 3, NOW), null);
  });

  it('stays silent with too little history to generalise from', () => {
    const thin = { samples: 2, medianCycleDays: 7, lateRate: 0.5 };
    assert.equal(scoreSlipRisk({ status: 'todo', dueDate: daysAhead(2) }, thin, 3, NOW), null);
    assert.equal(scoreSlipRisk({ status: 'todo', dueDate: daysAhead(2) }, null, 3, NOW), null);
  });

  it('stays silent when the runway is comfortable and habits are good', () => {
    const reliable = { samples: 10, medianCycleDays: 2, lateRate: 0.1 };
    assert.equal(scoreSlipRisk({ status: 'todo', dueDate: daysAhead(10) }, reliable, 0, NOW), null);
  });
});

describe('scoreSlipRisk — signal contract', () => {
  it('flags a tight runway for a habitually-late assignee, with a reason', () => {
    // Median cycle 10d, only 2d left, half their dated work lands late, busy.
    const profile = { samples: 8, medianCycleDays: 10, lateRate: 0.5 };
    const sig = scoreSlipRisk({ status: 'in_progress', dueDate: daysAhead(2) }, profile, 6, NOW);
    assert.ok(sig, 'expected a slip signal');
    assert.ok(sig!.p >= 0.6 && sig!.p < 1);
    assert.ok(sig!.reason.length > 10, 'reason must be a real sentence');
    assert.match(sig!.reason, /~10d/, 'dominant factor here is the runway');
  });

  it('prefers ccTcd over dueDate as the date that matters', () => {
    const profile = { samples: 8, medianCycleDays: 10, lateRate: 0.5 };
    // dueDate is far out (would be silent); ccTcd is in 1 day (should speak).
    const sig = scoreSlipRisk(
      { status: 'in_progress', dueDate: daysAhead(40), ccTcd: daysAhead(1) },
      profile,
      4,
      NOW,
    );
    assert.ok(sig, 'ccTcd must drive the forecast when present');
  });
});

describe('buildOpenLoad', () => {
  it('counts open tasks per assignee, ignoring done and unassigned', () => {
    const load = buildOpenLoad([
      { assigneeId: 'u1', status: 'todo' },
      { assigneeId: 'u1', status: 'in_progress' },
      { assigneeId: 'u1', status: 'done' },
      { status: 'todo' },
    ]);
    assert.equal(load.get('u1'), 2);
  });
});
