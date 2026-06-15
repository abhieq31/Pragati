/**
 * Work Mixer — mixing / grouping (Phase 1).
 *
 * Groups scored candidates into deterministic sections and sorts each one. This
 * is the "Home Mixer output" stage: turning a ranked pool into bounded,
 * dashboard-ready sections. No randomness, no AI, no personalisation beyond the
 * already role/privacy-filtered data the caller supplied.
 */

import type {
  ScoredCandidate,
  WorkCandidate,
  WorkMixerResult,
  WorkMixerSection,
  WorkMixerSectionKey,
} from './types';
import { classifyWorkCandidate, scoreWorkCandidate } from './score';

const SECTION_TITLES: Record<WorkMixerSectionKey, string> = {
  needs_attention: 'Needs attention',
  overdue: 'Overdue',
  due_soon: 'Due soon',
  waiting_or_blocked: 'Waiting or blocked',
  stalled: 'Stalled',
  normal: 'Normal',
};

/** Output order — most urgent first. */
const SECTION_ORDER: WorkMixerSectionKey[] = [
  'needs_attention',
  'overdue',
  'due_soon',
  'waiting_or_blocked',
  'stalled',
  'normal',
];

/** Default cap per section so payloads stay small. */
const DEFAULT_LIMIT = 10;

/** Score at or above which an item with no time/flow pressure still warrants a
 *  spot in "Needs attention" (e.g. critical priority, GxP-critical). */
const NEEDS_ATTENTION_THRESHOLD = 25;

export interface BuildWorkMixerOptions {
  now: Date;
  limitPerSection?: number;
}

function dueMs(v: ScoredCandidate['dueDate']): number {
  if (!v) return Number.POSITIVE_INFINITY;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** score desc → dueDate asc (undated last) → title asc. Fully deterministic. */
function compareScored(a: ScoredCandidate, b: ScoredCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  const da = dueMs(a.dueDate);
  const db = dueMs(b.dueDate);
  if (da !== db) return da - db;
  return (a.title ?? '').localeCompare(b.title ?? '');
}

/** Place a candidate into exactly one section. Done items are handled by the
 *  caller (excluded) before this runs. */
function sectionFor(state: ReturnType<typeof classifyWorkCandidate>, score: number): WorkMixerSectionKey {
  if (state.overdue) return 'overdue';
  if (state.blocked || state.waiting) return 'waiting_or_blocked';
  if (state.dueSoon) return 'due_soon';
  if (state.stalled) return 'stalled';
  if (score >= NEEDS_ATTENTION_THRESHOLD) return 'needs_attention';
  return 'normal';
}

/**
 * Build the mixer result from a pool of candidates. Done/completed candidates
 * are dropped (finished work needs no attention). Empty sections are omitted to
 * keep the payload lean.
 */
export function buildWorkMixer(candidates: WorkCandidate[], opts: BuildWorkMixerOptions): WorkMixerResult {
  const { now } = opts;
  const limit = Math.max(1, opts.limitPerSection ?? DEFAULT_LIMIT);

  const buckets = new Map<WorkMixerSectionKey, ScoredCandidate[]>();
  for (const c of candidates) {
    const state = classifyWorkCandidate(c, now);
    if (state.done) continue;
    const { score, reasons } = scoreWorkCandidate(c, now);
    const key = sectionFor(state, score);
    const arr = buckets.get(key) ?? [];
    arr.push({ ...c, score, reasons });
    buckets.set(key, arr);
  }

  const sections: WorkMixerSection[] = [];
  for (const key of SECTION_ORDER) {
    const arr = buckets.get(key);
    if (!arr || arr.length === 0) continue;
    arr.sort(compareScored);
    sections.push({ key, title: SECTION_TITLES[key], candidates: arr.slice(0, limit) });
  }

  return { sections, generatedAt: now.toISOString() };
}
