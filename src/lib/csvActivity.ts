import type { CsvActivityDoc } from '@/models/CsvActivity';
import { normalizeStageCells, rowCompletion, type CsvStageCell } from '@/lib/csvStages';

/** Parse a date-ish string into a Date, or null. Accepts ISO and dd/mm/yyyy. */
export function parseApprovalDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  // dd/mm/yyyy (the format the IDP sheet uses) — disambiguate from ISO.
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Normalize incoming rows (from a create/update body) into stored shape. */
export function normalizeRows(rows: any[] | undefined | null) {
  return (rows || []).map((r) => ({
    formatNumber: typeof r?.formatNumber === 'string' ? r.formatNumber : '',
    formatTitle: typeof r?.formatTitle === 'string' ? r.formatTitle : '',
    elogbookTitle: typeof r?.elogbookTitle === 'string' ? r.elogbookTitle : '',
    sites: typeof r?.sites === 'string' ? r.sites : '',
    stages: normalizeStageCells(r?.stages).map((c) => ({
      key: c.key,
      docNo: c.docNo,
      approvalDate: parseApprovalDate(c.approvalDate),
      status: c.status,
    })),
  }));
}

/** Shape a stored sheet for the client. Always returns rectangular stage cells. */
export function serializeCsvActivity(doc: CsvActivityDoc) {
  const rows = (doc.rows || []) as any[];
  return {
    id: String(doc._id),
    teamId: String(doc.teamId),
    changeControlNo: doc.changeControlNo,
    prNo: doc.prNo || '',
    title: doc.title || '',
    description: doc.description || '',
    createdBy: String(doc.createdBy),
    createdByName: doc.createdByName || '',
    createdAt: (doc as any).createdAt,
    updatedAt: (doc as any).updatedAt,
    rowCount: rows.length,
    rows: rows.map((r) => {
      const stages = normalizeStageCells(r.stages) as CsvStageCell[];
      return {
        id: String(r._id),
        formatNumber: r.formatNumber || '',
        formatTitle: r.formatTitle || '',
        elogbookTitle: r.elogbookTitle || '',
        sites: r.sites || '',
        completion: rowCompletion(stages),
        stages: stages.map((c) => ({
          key: c.key,
          docNo: c.docNo,
          approvalDate: c.approvalDate
            ? new Date(c.approvalDate as any).toISOString().slice(0, 10)
            : null,
          status: c.status,
        })),
      };
    }),
  };
}

export type SerializedCsvActivity = ReturnType<typeof serializeCsvActivity>;
