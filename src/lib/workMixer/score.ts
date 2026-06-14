/**
 * Work Mixer — deterministic scoring (Phase 1).
 *
 * PURE. No DB, no Redis, no AI, no hidden clock: `now` is always passed in so
 * the same input yields the same output, forever. This is the "ranking" stage
 * of the pipeline, expressed as boring, explainable arithmetic rather than a
 * model — every point added carries a reason.
 */

import type { WorkCandidate, WorkScore } from './types';

const DAY_MS = 86_400_000;

/** Point weights — exported so tests can assert against the contract instead of
 *  hard-coding magic numbers. Changing a number here is a deliberate act. */
export const SCORE_WEIGHTS = {
  overdue: 40,
  blockedOrWaiting: 35,
  dueWithin3: 25,
  dueWithin7: 15,
  critical: 25,
  high: 15,
  gxpCritical: 15,
  requiresQaSignoff: 10,
  stale7: 15,
  stale14: 25,
} as const;

/** Statuses that mean "this work is finished" — across both task and project
 *  vocabularies. A finished item never needs attention. */
const DONE_STATUSES = new Set(['done', 'completed', 'cancelled']);

/** Parse a date defensively. Missing/invalid input returns null and never
 *  throws, so a malformed record can't break a whole dashboard. */
function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function isDone(c: WorkCandidate): boolean {
  if (toDate(c.completedAt ?? null)) return true;
  return DONE_STATUSES.has((c.status ?? '').toLowerCase());
}

/** The derived state of a candidate at instant `now`. Computed once and shared
 *  by both scoring and sectioning so the two can never disagree. */
export interface WorkState {
  done: boolean;
  overdue: boolean;
  /** Due within 7 days and not overdue (includes the within-3 window). */
  dueSoon: boolean;
  /** Due within 3 days and not overdue. */
  dueWithin3: boolean;
  blocked: boolean;
  waiting: boolean;
  /** No meaningful activity for 7+ days. */
  stalled: boolean;
  idleDays: number | null;
}

export function classifyWorkCandidate(c: WorkCandidate, now: Date): WorkState {
  const done = isDone(c);

  let overdue = false;
  let dueSoon = false;
  let dueWithin3 = false;
  const due = toDate(c.dueDate ?? null);
  if (!done && due) {
    const diffDays = (due.getTime() - now.getTime()) / DAY_MS;
    if (diffDays < 0) overdue = true;
    else if (diffDays <= 3) {
      dueWithin3 = true;
      dueSoon = true;
    } else if (diffDays <= 7) {
      dueSoon = true;
    }
  }

  const status = (c.status ?? '').toLowerCase();
  const blocked = !done && (c.blocked === true || status === 'blocked' || status === 'on_hold');
  const waiting = !done && (c.waiting === true || status === 'review');

  let idleDays: number | null = null;
  let stalled = false;
  const activity = toDate(c.lastMeaningfulActivityAt ?? null);
  if (!done && activity) {
    idleDays = Math.floor((now.getTime() - activity.getTime()) / DAY_MS);
    if (idleDays >= 7) stalled = true;
  }

  return { done, overdue, dueSoon, dueWithin3, blocked, waiting, stalled, idleDays };
}

/**
 * Score a single candidate. Returns the numeric score and the ordered reasons
 * that built it. Done work scores 0 by construction.
 */
export function scoreWorkCandidate(c: WorkCandidate, now: Date): WorkScore {
  const st = classifyWorkCandidate(c, now);
  if (st.done) return { score: 0, reasons: ['Completed'] };

  const W = SCORE_WEIGHTS;
  let score = 0;
  const reasons: string[] = [];

  // Time pressure — exactly one of these fires (overdue beats due-soon).
  if (st.overdue) {
    score += W.overdue;
    reasons.push('Overdue');
  } else if (st.dueWithin3) {
    score += W.dueWithin3;
    reasons.push('Due within 3 days');
  } else if (st.dueSoon) {
    score += W.dueWithin7;
    reasons.push('Due within 7 days');
  }

  // Flow state — blocked and waiting share one weight; blocked wins the label.
  if (st.blocked) {
    score += W.blockedOrWaiting;
    reasons.push('Blocked');
  } else if (st.waiting) {
    score += W.blockedOrWaiting;
    reasons.push('Waiting');
  }

  const priority = (c.priority ?? '').toLowerCase();
  if (priority === 'critical') {
    score += W.critical;
    reasons.push('Critical priority');
  } else if (priority === 'high') {
    score += W.high;
    reasons.push('High priority');
  }

  if (c.gxpCritical) {
    score += W.gxpCritical;
    reasons.push('GxP-critical');
  }
  if (c.requiresQaSignoff) {
    score += W.requiresQaSignoff;
    reasons.push('Needs QA sign-off');
  }

  // Staleness — only when we actually know the last activity time.
  if (st.idleDays !== null) {
    if (st.idleDays >= 14) {
      score += W.stale14;
      reasons.push('No meaningful activity in 14d');
    } else if (st.idleDays >= 7) {
      score += W.stale7;
      reasons.push('No meaningful activity in 7d');
    }
  }

  return { score: Math.max(0, score), reasons };
}
