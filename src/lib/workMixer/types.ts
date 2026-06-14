/**
 * Work Mixer — internal types (Phase 1).
 *
 * A small, free-stack translation of X/Twitter's Product Mixer pattern:
 *   candidate sourcing → deterministic scoring → permission filtering → grouped
 *   output.
 *
 * These types are INTERNAL only. They are not bound to any UI, route, or API
 * response shape. Nothing here renders; nothing here queries MongoDB. The whole
 * module is pure and removable without touching the rest of the app.
 */

/** A unit of work the mixer can reason about — a task or a project, normalised
 *  from data the dashboard/project-list code already fetched and permission-
 *  filtered. Never constructed from raw, unfiltered records. */
export interface WorkCandidate {
  id: string;
  kind: 'task' | 'project';
  title: string;
  projectId?: string;
  assigneeId?: string;
  ownerId?: string;
  status?: string;
  priority?: string;
  dueDate?: string | Date | null;
  completedAt?: string | Date | null;
  /** Last time the item meaningfully moved. Optional — when absent, staleness
   *  scoring simply doesn't fire (no guessing, no throwing). */
  lastMeaningfulActivityAt?: string | Date | null;
  gxpCritical?: boolean;
  requiresQaSignoff?: boolean;
  /** Optional pre-derived hints. When unset, the scorer derives them from
   *  `status` (e.g. 'blocked' / 'review' / 'on_hold'). */
  waiting?: boolean;
  blocked?: boolean;
  overdue?: boolean;
  dueSoon?: boolean;
  source?: string;
}

/** The deterministic score plus the human-readable reasons that produced it.
 *  Reasons exist so the ranking is always explainable — never a black box. */
export interface WorkScore {
  score: number;
  reasons: string[];
}

export type WorkMixerSectionKey =
  | 'needs_attention'
  | 'overdue'
  | 'due_soon'
  | 'waiting_or_blocked'
  | 'stalled'
  | 'normal';

/** A candidate after scoring — the shape that lands inside a section. */
export type ScoredCandidate = WorkCandidate & { score: number; reasons: string[] };

export interface WorkMixerSection {
  key: WorkMixerSectionKey;
  title: string;
  candidates: ScoredCandidate[];
}

/** The full mixer output. `generatedAt` is an ISO string so it survives JSON
 *  round-trips (cache, API) without becoming a `Date` the client mishandles. */
export interface WorkMixerResult {
  sections: WorkMixerSection[];
  generatedAt: string;
}
