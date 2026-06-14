/**
 * Work Mixer — candidate sourcing (Phase 1).
 *
 * Transforms data the dashboard/project-list code ALREADY fetched and
 * permission-filtered into normalised `WorkCandidate` objects. It adds NO new
 * Mongo queries and NEVER mutates its inputs — it only reads.
 *
 * The effective due date mirrors the rest of the app: a task's Change-Control
 * target date (`ccTcd`) wins over a plain `dueDate`.
 */

import type { WorkCandidate } from './types';

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v);
  return s.length ? s : undefined;
}

/** Normalise one task (raw doc or serialized dashboard item) → WorkCandidate. */
export function taskToCandidate(t: any): WorkCandidate {
  return {
    id: String(t?.id ?? t?._id ?? ''),
    kind: 'task',
    title: t?.title ?? '',
    projectId: str(t?.projectId),
    assigneeId: str(t?.assigneeId),
    status: t?.status,
    priority: t?.priority,
    // Effective due — ccTcd (CC target date) wins over dueDate, matching the
    // dashboards, calendar and digest.
    dueDate: t?.ccTcd ?? t?.dueDate ?? null,
    completedAt: t?.completedAt ?? null,
    lastMeaningfulActivityAt: t?.lastMeaningfulActivityAt ?? null,
    gxpCritical: !!t?.gxpCritical,
    requiresQaSignoff: !!t?.requiresQaSignoff,
    blocked: t?.status === 'blocked',
    waiting: t?.status === 'review',
    source: 'dashboard',
  };
}

/** Normalise one project (serialized dashboard/project-list item) → candidate.
 *  A project on hold reads as blocked; high GxP impact reads as GxP-critical. */
export function projectToCandidate(p: any): WorkCandidate {
  return {
    id: String(p?.id ?? p?._id ?? ''),
    kind: 'project',
    title: p?.name ?? '',
    projectId: str(p?.id ?? p?._id),
    ownerId: str(p?.ownerId),
    status: p?.status,
    priority: p?.priority,
    dueDate: p?.dueDate ?? null,
    completedAt: p?.completedAt ?? null,
    gxpCritical: p?.gxpImpact === 'high',
    blocked: p?.status === 'on_hold',
    source: 'dashboard',
  };
}

/**
 * Build the candidate pool from an already-computed dashboard payload
 * (`LeadDashboardData`-shaped). Tasks and projects are deduplicated by kind+id
 * so an item that appears in both `teamTasks` and `tasks` is counted once.
 */
export function buildCandidatesFromDashboardData(data: any): WorkCandidate[] {
  const out: WorkCandidate[] = [];
  const seen = new Set<string>();

  const addTask = (t: any) => {
    const c = taskToCandidate(t);
    const k = `task:${c.id}`;
    if (c.id && !seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  };

  for (const t of Array.isArray(data?.teamTasks) ? data.teamTasks : []) addTask(t);
  for (const t of Array.isArray(data?.tasks) ? data.tasks : []) addTask(t);

  for (const p of Array.isArray(data?.projects) ? data.projects : []) {
    const c = projectToCandidate(p);
    const k = `project:${c.id}`;
    if (c.id && !seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }

  return out;
}
