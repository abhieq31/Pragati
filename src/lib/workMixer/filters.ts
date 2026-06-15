/**
 * Work Mixer — permission filtering (Phase 1).
 *
 * Phase 1 deliberately introduces NO new permission logic. Every candidate is
 * built from data that leadDashboard.ts / projectList.ts already fetched through
 * getLeadScope + projectsVisibleFilter (see src/lib/leadScope.ts), so the role,
 * team, and privacy boundaries have ALREADY been applied before a candidate
 * exists. Re-deriving them here would only risk drifting from the real rule and
 * accidentally widening visibility.
 *
 * This module therefore stays intentionally minimal: it drops only structurally
 * unusable candidates (no id). It must NEVER widen what the caller could see.
 */

import type { WorkCandidate } from './types';

export function filterWorkCandidates(candidates: WorkCandidate[]): WorkCandidate[] {
  return candidates.filter((c) => !!c.id);
}
