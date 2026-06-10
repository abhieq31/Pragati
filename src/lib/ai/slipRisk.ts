/**
 * Slip-risk early warning — a small, deterministic predictive model that
 * learns each person's actual delivery behaviour from history and flags open
 * tasks that are *likely to miss their date* before they do.
 *
 * The real problem this solves: every tracker can show you what's already
 * late — by then the conversation is an apology. The useful moment is the
 * one BEFORE that, when a date can still be saved by rebalancing, trimming
 * scope, or just starting earlier. Leads get that moment for their people;
 * contributors get it for their own plate.
 *
 * Deliberately not an LLM, and deliberately unbranded in the UI: the user
 * just sees a quiet "May slip" cue with a plain-language reason. Every
 * score is traceable to a line of code — a hand-calibrated logistic over
 * three features:
 *
 *   runway   — how the time left compares to the assignee's real median
 *              cycle time for the work they complete (learned per person)
 *   habit    — the assignee's historical past-due rate, Laplace-smoothed
 *              so two data points can't brand anyone a deadline-misser
 *   pressure — how many other open tasks compete for the same window
 *
 * Pure functions, no I/O: callers feed it the task rows they already
 * loaded, so the feature costs zero extra queries and zero external
 * services — free forever by construction.
 */

export interface DeliveryProfile {
  /** Completed tasks with measurable cycle time. */
  samples: number;
  /** Median calendar days from creation to completion. */
  medianCycleDays: number;
  /** Smoothed share of dated work that finished past its date: (late+1)/(n+2). */
  lateRate: number;
}

interface TaskLike {
  assigneeId?: unknown;
  status?: string;
  createdAt?: Date | string | null;
  completedAt?: Date | string | null;
  dueDate?: Date | string | null;
  ccTcd?: Date | string | null;
}

const DAY = 86_400_000;

function days(a: Date, b: Date): number {
  return Math.round((+b - +a) / DAY);
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(+d) ? null : d;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/** Learn one delivery profile per assignee from completed tasks. */
export function buildDeliveryProfiles(tasks: TaskLike[]): Map<string, DeliveryProfile> {
  const byAssignee = new Map<string, { cycles: number[]; dated: number; late: number }>();
  for (const t of tasks) {
    if (t.status !== 'done' || !t.assigneeId) continue;
    const created = toDate(t.createdAt);
    const completed = toDate(t.completedAt);
    if (!created || !completed) continue;
    const id = String(t.assigneeId);
    const cur = byAssignee.get(id) || { cycles: [], dated: 0, late: 0 };
    const cycle = days(created, completed);
    if (cycle >= 0 && cycle <= 180) cur.cycles.push(cycle);
    const due = toDate(t.ccTcd) || toDate(t.dueDate);
    if (due) {
      cur.dated++;
      if (+completed > +due + DAY / 2) cur.late++; // half-day grace for time-of-day noise
    }
    byAssignee.set(id, cur);
  }

  const out = new Map<string, DeliveryProfile>();
  for (const [id, v] of byAssignee) {
    if (!v.cycles.length) continue;
    out.set(id, {
      samples: v.cycles.length,
      medianCycleDays: Math.max(1, median(v.cycles)),
      lateRate: (v.late + 1) / (v.dated + 2),
    });
  }
  return out;
}

export interface SlipSignal {
  /** Probability-shaped score in (0, 1). */
  p: number;
  /** One plain-language sentence naming the dominant factor. */
  reason: string;
}

/**
 * Score one open task. Returns null when there is nothing trustworthy to
 * say — no due date, already overdue (a fact, not a forecast), due too far
 * out to be actionable, or too little history to generalise from.
 */
export function scoreSlipRisk(
  task: TaskLike,
  profile: DeliveryProfile | null | undefined,
  openLoad: number,
  now = new Date(),
): SlipSignal | null {
  if (task.status === 'done' || task.status === 'blocked') return null;
  const due = toDate(task.ccTcd) || toDate(task.dueDate);
  if (!due) return null;
  const daysToDue = Math.ceil((+due - +now) / DAY);
  // Overdue is the dashboard's existing red chip; a forecast 3 weeks out is
  // guesswork. The model only speaks in the window where it can be useful.
  if (daysToDue < 0 || daysToDue > 14) return null;
  if (!profile || profile.samples < 3) return null;

  const runway = Math.max(
    -1,
    Math.min(1, (profile.medianCycleDays - daysToDue) / Math.max(2, profile.medianCycleDays)),
  );
  const habit = profile.lateRate;
  const pressure = Math.min(1, openLoad / 6);

  const z = -1.9 + 2.4 * runway + 1.7 * habit + 0.9 * pressure;
  const p = 1 / (1 + Math.exp(-z));
  if (p < 0.6) return null;

  // Name the dominant factor so the cue reads as observation, not oracle.
  const contributions: [number, string][] = [
    [
      2.4 * runway,
      `similar work usually takes ~${profile.medianCycleDays}d — ${daysToDue === 0 ? 'due today' : `${daysToDue}d left`}`,
    ],
    [1.7 * habit, 'recent work often landed past its date'],
    [0.9 * pressure, `${openLoad} open tasks compete for the same window`],
  ];
  contributions.sort((a, b) => b[0] - a[0]);

  return { p: Math.round(p * 100) / 100, reason: contributions[0][1] };
}

/** Count open tasks per assignee — the "pressure" feature. */
export function buildOpenLoad(tasks: TaskLike[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of tasks) {
    if (t.status === 'done' || !t.assigneeId) continue;
    const id = String(t.assigneeId);
    out.set(id, (out.get(id) || 0) + 1);
  }
  return out;
}
