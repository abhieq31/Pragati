import type { CsvActivityDoc } from '@/models/CsvActivity';
import {
  normalizeStageCells,
  rowCompletion,
  sheetStages,
  DEFAULT_STAGES,
  type StageCell,
  type StageDef,
} from '@/lib/csvStages';

/** Parse a date-ish string into a Date, or null. Accepts ISO and dd/mm/yyyy. */
export function parseStageDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  // dd/mm/yyyy — disambiguate from ISO.
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Coerce a raw `stages` def list (from a request body) into a clean StageDef[]. */
export function normalizeStageDefs(stages: any[] | undefined | null): StageDef[] {
  if (!Array.isArray(stages)) return DEFAULT_STAGES.map((s) => ({ ...s }));
  return sheetStages(stages);
}

/** A legacy row may carry the old pharma field names — read them as a fallback. */
function rowRef(r: any): string {
  return typeof r?.ref === 'string' ? r.ref : typeof r?.formatNumber === 'string' ? r.formatNumber : '';
}
function rowName(r: any): string {
  if (typeof r?.name === 'string') return r.name;
  if (typeof r?.formatTitle === 'string') return r.formatTitle;
  if (typeof r?.elogbookTitle === 'string') return r.elogbookTitle;
  return '';
}
function rowNote(r: any): string {
  return typeof r?.note === 'string' ? r.note : typeof r?.sites === 'string' ? r.sites : '';
}

/**
 * Normalize incoming rows (from a create/update body) into stored shape, using
 * the sheet's stage defs to keep every row rectangular.
 */
export function normalizeRows(rows: any[] | undefined | null, defs: readonly StageDef[]) {
  return (rows || []).map((r) => ({
    ref: rowRef(r),
    name: rowName(r),
    note: rowNote(r),
    stages: normalizeStageCells(r?.stages, defs).map((c) => ({
      key: c.key,
      ref: c.ref,
      date: parseStageDate(c.date),
      status: c.status,
    })),
  }));
}

/** Shape a stored sheet for the client. Always returns rectangular stage cells. */
export function serializeCsvActivity(doc: CsvActivityDoc) {
  const d = doc as any;
  const defs = sheetStages(d.stages);
  const rows = (d.rows || []) as any[];
  return {
    id: String(d._id),
    teamId: String(d.teamId),
    // Bridge legacy field names so sheets created before the rename still read.
    reference: d.reference || d.changeControlNo || '',
    reference2: d.reference2 || d.prNo || '',
    title: d.title || '',
    description: d.description || '',
    stages: defs,
    createdBy: String(d.createdBy),
    createdByName: d.createdByName || '',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    rowCount: rows.length,
    rows: rows.map((r) => {
      const stages = normalizeStageCells(r.stages, defs) as StageCell[];
      return {
        id: String(r._id),
        ref: rowRef(r),
        name: rowName(r),
        note: rowNote(r),
        completion: rowCompletion(stages),
        stages: stages.map((c) => ({
          key: c.key,
          ref: c.ref,
          date: c.date ? new Date(c.date as any).toISOString().slice(0, 10) : null,
          status: c.status,
        })),
      };
    }),
  };
}

export type SerializedCsvActivity = ReturnType<typeof serializeCsvActivity>;
