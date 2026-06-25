/**
 * Generic tracker stages — the configurable column model behind the QMS /
 * quality-tracking module.
 *
 * A tracker sheet is a small grid: one row per item, and a set of *stages* the
 * item moves through. Each stage cell records a reference, a date, and a status
 * (Done / In progress / Pending / NA). The stages are defined per sheet, so the
 * same mechanism works for a validation checklist, an approval workflow, an
 * onboarding tracker, or a support-process pipeline — whatever the team needs.
 *
 * Used by the model (to seed empty rows), the API (to validate/normalize), the
 * grid UI (to render columns), and the export (to lay the table out).
 */

export type StageStatus = 'pending' | 'in_progress' | 'na' | 'done';

/** One configurable column in a tracker sheet. */
export interface StageDef {
  /** Stable, sheet-unique key (free-form). */
  key: string;
  /** Human label shown in the column header. */
  label: string;
}

/** What every new sheet starts with — neutral, rename/extend as needed. */
export const DEFAULT_STAGES: readonly StageDef[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'Review' },
  { key: 'approval', label: 'Approval' },
] as const;

/**
 * Fallback stages for sheets created before columns were configurable (they have
 * no stored `stages`). Mirrors the original six-step validation layout so legacy
 * data still renders with meaningful headers.
 */
export const LEGACY_STAGES: readonly StageDef[] = [
  { key: 'cs', label: 'CS' },
  { key: 'cdd_val', label: 'CDD (Val)' },
  { key: 'oq', label: 'OQ' },
  { key: 'cdd_prod', label: 'CDD (Prod)' },
  { key: 'vsr', label: 'VSR' },
  { key: 'shf', label: 'SHF' },
] as const;

export const STAGE_STATUSES: readonly StageStatus[] = ['pending', 'in_progress', 'na', 'done'];

export const STATUS_LABEL: Record<StageStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  na: 'NA',
  done: 'Done',
};

export interface StageCell {
  key: string;
  /** Free-text reference for the stage (doc / ticket / link). */
  ref: string;
  /** ISO/date string or null. */
  date: string | Date | null;
  status: StageStatus;
}

/** Coerce a stored/raw stages value into a clean StageDef[], with a fallback. */
export function sheetStages(stored: Partial<StageDef>[] | undefined | null): StageDef[] {
  const defs = (stored || [])
    .filter((s) => s && typeof s.key === 'string' && s.key.trim())
    .map((s) => ({ key: String(s.key).trim(), label: (s.label ?? '').toString() || String(s.key).trim() }));
  if (defs.length) return dedupeByKey(defs);
  // No stored defs → legacy sheet. Use the original validation layout.
  return [...LEGACY_STAGES];
}

function dedupeByKey(defs: StageDef[]): StageDef[] {
  const seen = new Set<string>();
  const out: StageDef[] = [];
  for (const d of defs) {
    if (seen.has(d.key)) continue;
    seen.add(d.key);
    out.push(d);
  }
  return out;
}

/** A fresh, empty stage cell per provided stage def, in order. */
export function emptyStageCells(defs: readonly StageDef[]): StageCell[] {
  return defs.map((s) => ({ key: s.key, ref: '', date: null, status: 'pending' as StageStatus }));
}

/**
 * Coerce whatever stage cells a row currently has into the full set defined by
 * `defs`, in order, dropping unknown keys and filling missing ones. Keeps the
 * grid rectangular no matter how a row was created or imported.
 */
export function normalizeStageCells(
  cells: Partial<StageCell>[] | undefined | null,
  defs: readonly StageDef[],
): StageCell[] {
  const byKey = new Map<string, Partial<StageCell>>();
  for (const c of cells || []) {
    if (c && typeof c.key === 'string') byKey.set(c.key, c);
  }
  return defs.map((s) => {
    const c = byKey.get(s.key) || {};
    const status: StageStatus = STAGE_STATUSES.includes(c.status as StageStatus)
      ? (c.status as StageStatus)
      : 'pending';
    // Tolerate the legacy `docNo`/`approvalDate` field names on raw input.
    const ref = typeof c.ref === 'string' ? c.ref : typeof (c as any).docNo === 'string' ? (c as any).docNo : '';
    const date = c.date ?? (c as any).approvalDate ?? null;
    return { key: s.key, ref, date, status };
  });
}

/** Percent of applicable stages completed (NA stages are excluded from the denominator). */
export function rowCompletion(cells: Partial<StageCell>[] | undefined | null): number {
  const applicable = (cells || []).filter((c) => c && c.status !== 'na');
  if (applicable.length === 0) return 100; // nothing applicable → nothing outstanding
  const done = applicable.filter((c) => c.status === 'done').length;
  return Math.round((done / applicable.length) * 100);
}
