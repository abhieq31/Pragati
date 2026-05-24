/**
 * Priority-weighted project progress.
 *
 * A plain done/total ratio treats a trivial low-priority task the same as a
 * critical one. Pragati weights each task by its priority so finishing the
 * heavy, important work moves the bar more than ticking off small items —
 * which is what a lead actually means by "how far along is this project".
 *
 *   critical = 4 · high = 3 · medium = 2 · low = 1   (unknown → medium)
 *
 * progress = Σ(weight of done tasks) / Σ(weight of all tasks) × 100
 */
export const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
};

function weightOf(priority?: string | null): number {
  return PRIORITY_WEIGHT[priority || 'medium'] ?? 2;
}

export function weightedProgress(
  tasks: Array<{ status?: string | null; priority?: string | null }>,
): number {
  let total = 0;
  let done = 0;
  for (const t of tasks) {
    const w = weightOf(t.priority);
    total += w;
    if (t.status === 'done') done += w;
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}
