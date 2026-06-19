/**
 * Single source of truth for the CSV Activity tracker's document stages.
 *
 * This digitizes the Excel sheet the IDP / CSV team maintains by hand: each
 * Format (e-logbook) row passes through the same fixed sequence of validation
 * documents, and for each one they record a document number, an approval date,
 * and a status (Done / Pending / NA). The column order below is the exact order
 * those documents appear in the team's sheet, so the on-screen grid reads the
 * same as the spreadsheet it replaces.
 *
 * Used by the model (to seed empty rows), the API (to validate/normalize), the
 * grid UI (to render columns), and the export (to lay the table out).
 */

export type CsvStageKey = 'cs' | 'cdd_val' | 'oq' | 'cdd_prod' | 'vsr' | 'shf';

export type CsvStageStatus = 'pending' | 'in_progress' | 'na' | 'done';

export interface CsvStageDef {
  key: CsvStageKey;
  /** Short column header in the grid. */
  short: string;
  /** Full name, shown on hover / in the column tooltip. */
  long: string;
  /** Which environment the document belongs to, where it matters. */
  environment?: 'validation' | 'production';
}

export const CSV_STAGE_DEFS: readonly CsvStageDef[] = [
  { key: 'cs', short: 'CS', long: 'Configuration Specification (CS) — with date of approval' },
  {
    key: 'cdd_val',
    short: 'CDD (Val)',
    long: 'Configuration Design Document (CDD) — Validation environment',
    environment: 'validation',
  },
  { key: 'oq', short: 'OQ', long: 'Operational Qualification (OQ) Protocol — with date of approval' },
  {
    key: 'cdd_prod',
    short: 'CDD (Prod)',
    long: 'Configuration Design Document (CDD) — Production environment',
    environment: 'production',
  },
  { key: 'vsr', short: 'VSR', long: 'Validation Summary Report (VSR) — with date of approval' },
  { key: 'shf', short: 'SHF', long: 'System Handover Form (SHF) — with date of approval' },
] as const;

export const CSV_STAGE_KEYS: readonly CsvStageKey[] = CSV_STAGE_DEFS.map((s) => s.key);

export const CSV_STAGE_STATUSES: readonly CsvStageStatus[] = ['pending', 'in_progress', 'na', 'done'];

export const CSV_STATUS_LABEL: Record<CsvStageStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  na: 'NA',
  done: 'Done',
};

export interface CsvStageCell {
  key: CsvStageKey;
  docNo: string;
  approvalDate: string | Date | null;
  status: CsvStageStatus;
}

/** A fresh, fully-populated set of six empty stage cells in canonical order. */
export function emptyStageCells(): CsvStageCell[] {
  return CSV_STAGE_DEFS.map((s) => ({ key: s.key, docNo: '', approvalDate: null, status: 'pending' }));
}

/**
 * Coerce whatever stage cells a row currently has into the full canonical set,
 * in order, dropping unknown keys and filling missing ones. Keeps the grid
 * rectangular no matter how a row was created or imported.
 */
export function normalizeStageCells(cells: Partial<CsvStageCell>[] | undefined | null): CsvStageCell[] {
  const byKey = new Map<string, Partial<CsvStageCell>>();
  for (const c of cells || []) {
    if (c && typeof c.key === 'string') byKey.set(c.key, c);
  }
  return CSV_STAGE_DEFS.map((s) => {
    const c = byKey.get(s.key) || {};
    const status: CsvStageStatus = CSV_STAGE_STATUSES.includes(c.status as CsvStageStatus)
      ? (c.status as CsvStageStatus)
      : 'pending';
    return {
      key: s.key,
      docNo: typeof c.docNo === 'string' ? c.docNo : '',
      approvalDate: c.approvalDate ?? null,
      status,
    };
  });
}

/** Percent of applicable stages completed (NA stages are excluded from the denominator). */
export function rowCompletion(cells: Partial<CsvStageCell>[] | undefined | null): number {
  const full = normalizeStageCells(cells);
  const applicable = full.filter((c) => c.status !== 'na');
  if (applicable.length === 0) return 100;
  const done = applicable.filter((c) => c.status === 'done').length;
  return Math.round((done / applicable.length) * 100);
}
