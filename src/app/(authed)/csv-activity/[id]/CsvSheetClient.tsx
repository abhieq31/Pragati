'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { useToast } from '@/components/ui';
import { useIsLead } from '@/components/CurrentUserContext';
import {
  CSV_STAGE_DEFS,
  CSV_STATUS_LABEL,
  CSV_STAGE_STATUSES,
  emptyStageCells,
  rowCompletion,
  type CsvStageStatus,
  type CsvStageKey,
} from '@/lib/csvStages';
import { ArrowLeft, Plus, Trash2, Download, Check, Loader2 } from 'lucide-react';

interface StageCell {
  key: CsvStageKey;
  docNo: string;
  approvalDate: string | null;
  status: CsvStageStatus;
}
interface Row {
  id?: string;
  formatNumber: string;
  formatTitle: string;
  elogbookTitle: string;
  sites: string;
  stages: StageCell[];
  completion?: number;
}
interface Sheet {
  id: string;
  changeControlNo: string;
  prNo: string;
  title: string;
  rows: Row[];
}

const STATUS_STYLE: Record<CsvStageStatus, { bg: string; fg: string }> = {
  done: { bg: '#dcfce7', fg: '#15803d' },
  in_progress: { bg: '#dbeafe', fg: '#1d4ed8' },
  pending: { bg: '#fef3c7', fg: '#b45309' },
  na: { bg: '#f1f5f9', fg: '#64748b' },
};

export default function CsvSheetClient({ initialSheet }: { initialSheet: Sheet }) {
  const isLead = useIsLead();
  const router = useRouter();
  const { showToast, ToastEl } = useToast();
  const [sheet, setSheet] = useState<Sheet>(initialSheet);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editable = isLead;

  const persist = useCallback(
    (next: Sheet) => {
      setSaveState('saving');
      api(`/csv-activity/${next.id}`, {
        method: 'PATCH',
        body: {
          changeControlNo: next.changeControlNo,
          prNo: next.prNo,
          title: next.title,
          rows: next.rows.map((r) => ({
            formatNumber: r.formatNumber,
            formatTitle: r.formatTitle,
            elogbookTitle: r.elogbookTitle,
            sites: r.sites,
            stages: r.stages.map((s) => ({
              key: s.key,
              docNo: s.docNo,
              approvalDate: s.approvalDate,
              status: s.status,
            })),
          })),
        },
      })
        .then(() => {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1500);
        })
        .catch((e: any) => {
          setSaveState('idle');
          showToast(e.message || 'Save failed — your last edit may not be stored.', 'err');
        });
    },
    [showToast],
  );

  // Debounced auto-save: edits flow into local state immediately; the sheet is
  // written ~700ms after the last keystroke so typing stays snappy.
  function scheduleSave(next: Sheet) {
    setSheet(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 700);
  }

  useEffect(() => () => void (saveTimer.current && clearTimeout(saveTimer.current)), []);

  function updateRow(idx: number, patch: Partial<Row>) {
    const rows = sheet.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    scheduleSave({ ...sheet, rows });
  }
  function updateStage(rowIdx: number, stageKey: string, patch: Partial<StageCell>) {
    const rows = sheet.rows.map((r, i) =>
      i === rowIdx
        ? { ...r, stages: r.stages.map((s) => (s.key === stageKey ? { ...s, ...patch } : s)) }
        : r,
    );
    scheduleSave({ ...sheet, rows });
  }
  function addRow() {
    scheduleSave({
      ...sheet,
      rows: [
        ...sheet.rows,
        { formatNumber: '', formatTitle: '', elogbookTitle: '', sites: '', stages: emptyStageCells() as StageCell[] },
      ],
    });
  }
  function deleteRow(idx: number) {
    scheduleSave({ ...sheet, rows: sheet.rows.filter((_, i) => i !== idx) });
  }

  function exportCsv() {
    const head = ['Sr. No', 'Format Number', 'Format Title', 'Elogbook title', 'Applicable sites'];
    for (const s of CSV_STAGE_DEFS) head.push(`${s.short} Doc No`, `${s.short} Approved`, `${s.short} Status`);
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.map(esc).join(',')];
    sheet.rows.forEach((r, i) => {
      const cells = [String(i + 1), r.formatNumber, r.formatTitle, r.elogbookTitle, r.sites];
      for (const def of CSV_STAGE_DEFS) {
        const s = r.stages.find((x) => x.key === def.key);
        cells.push(s?.docNo || '', s?.approvalDate || '', s ? CSV_STATUS_LABEL[s.status] : '');
      }
      lines.push(cells.map(esc).join(','));
    });
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.changeControlNo.replace(/[^\w]+/g, '_')}_CSV_activity.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function removeSheet() {
    if (!confirm(`Delete the entire sheet ${sheet.changeControlNo}? This cannot be undone.`)) return;
    try {
      await api(`/csv-activity/${sheet.id}`, { method: 'DELETE' });
      router.push('/csv-activity');
    } catch (e: any) {
      showToast(e.message || 'Could not delete the sheet.', 'err');
    }
  }

  const overall =
    sheet.rows.length === 0
      ? 0
      : Math.round(sheet.rows.reduce((a, r) => a + rowCompletion(r.stages), 0) / sheet.rows.length);

  return (
    <div className="space-y-4 max-w-[1400px]">
      {ToastEl}
      <Link href="/csv-activity" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600">
        <ArrowLeft size={15} /> All CSV activity sheets
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{sheet.changeControlNo}</h1>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
            {sheet.prNo ? `PR ${sheet.prNo} · ` : ''}
            {sheet.rows.length} format{sheet.rows.length === 1 ? '' : 's'} · {overall}% complete
            {sheet.title ? ` · ${sheet.title}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 w-16 text-right">
            {saveState === 'saving' && (
              <span className="inline-flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving
              </span>
            )}
            {saveState === 'saved' && (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={12} /> Saved
              </span>
            )}
          </span>
          <button onClick={exportCsv} className="btn-ghost gap-1.5">
            <Download size={14} /> Export CSV
          </button>
          {editable && (
            <button onClick={addRow} className="btn-primary gap-1.5">
              <Plus size={14} /> Add format
            </button>
          )}
        </div>
      </div>

      {!editable && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
          View only — ask a team lead to update document status.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="text-sm border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.04] text-left">
              <th className="px-2 py-2 font-semibold text-slate-500 w-10 text-center">#</th>
              <th className="px-2 py-2 font-semibold text-slate-500 min-w-[160px] sticky left-0 bg-slate-50 dark:bg-[#0c1322]">
                Format
              </th>
              <th className="px-2 py-2 font-semibold text-slate-500 min-w-[150px]">Elogbook title</th>
              <th className="px-2 py-2 font-semibold text-slate-500 min-w-[90px]">Sites</th>
              {CSV_STAGE_DEFS.map((s) => (
                <th
                  key={s.key}
                  title={s.long}
                  className="px-2 py-2 font-semibold text-slate-500 min-w-[150px] border-l border-slate-200 dark:border-white/10"
                >
                  {s.short}
                </th>
              ))}
              <th className="px-2 py-2 font-semibold text-slate-500 w-12 text-center">%</th>
              {editable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.length === 0 && (
              <tr>
                <td colSpan={5 + CSV_STAGE_DEFS.length + (editable ? 2 : 1)} className="px-3 py-8 text-center text-slate-400">
                  No formats yet. {editable ? 'Click "Add format" to begin.' : ''}
                </td>
              </tr>
            )}
            {sheet.rows.map((row, idx) => (
              <tr key={row.id || idx} className="border-t border-slate-100 dark:border-white/[0.06] align-top">
                <td className="px-2 py-2 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                <td className="px-2 py-2 sticky left-0 bg-white dark:bg-[#0a0f1a]">
                  <input
                    className="cell-input font-medium"
                    placeholder="Format number"
                    value={row.formatNumber}
                    disabled={!editable}
                    onChange={(e) => updateRow(idx, { formatNumber: e.target.value })}
                  />
                  <input
                    className="cell-input text-slate-500"
                    placeholder="Format title"
                    value={row.formatTitle}
                    disabled={!editable}
                    onChange={(e) => updateRow(idx, { formatTitle: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className="cell-input"
                    placeholder="Elogbook title"
                    value={row.elogbookTitle}
                    disabled={!editable}
                    onChange={(e) => updateRow(idx, { elogbookTitle: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className="cell-input"
                    placeholder="F4"
                    value={row.sites}
                    disabled={!editable}
                    onChange={(e) => updateRow(idx, { sites: e.target.value })}
                  />
                </td>
                {CSV_STAGE_DEFS.map((def) => {
                  const cell = row.stages.find((s) => s.key === def.key)!;
                  return (
                    <td key={def.key} className="px-2 py-2 border-l border-slate-100 dark:border-white/[0.06] space-y-1">
                      <input
                        className="cell-input text-xs"
                        placeholder="Doc No"
                        value={cell.docNo}
                        disabled={!editable}
                        onChange={(e) => updateStage(idx, def.key, { docNo: e.target.value })}
                      />
                      <input
                        type="date"
                        className="cell-input text-xs"
                        value={cell.approvalDate || ''}
                        disabled={!editable}
                        onChange={(e) => updateStage(idx, def.key, { approvalDate: e.target.value || null })}
                      />
                      <select
                        className="cell-input text-xs font-semibold rounded"
                        value={cell.status}
                        disabled={!editable}
                        style={{ background: STATUS_STYLE[cell.status].bg, color: STATUS_STYLE[cell.status].fg }}
                        onChange={(e) => updateStage(idx, def.key, { status: e.target.value as CsvStageStatus })}
                      >
                        {CSV_STAGE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {CSV_STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center tabular-nums text-slate-500 font-semibold">
                  {rowCompletion(row.stages)}%
                </td>
                {editable && (
                  <td className="px-1 py-2 text-center">
                    <button
                      onClick={() => deleteRow(idx)}
                      aria-label="Delete format"
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && (
        <div className="flex justify-between items-center pt-2">
          <button onClick={addRow} className="btn-ghost gap-1.5">
            <Plus size={14} /> Add format
          </button>
          <button onClick={removeSheet} className="text-xs text-red-500 hover:underline">
            Delete sheet
          </button>
        </div>
      )}

      <style>{`
        .cell-input {
          width: 100%;
          padding: 3px 6px;
          border: 1px solid transparent;
          border-radius: 5px;
          background: transparent;
          outline: none;
          font-size: 12px;
        }
        .cell-input:hover:not(:disabled) { border-color: #e2e8f0; }
        .cell-input:focus { border-color: #3b82f6; background: #fff; }
        .cell-input:disabled { cursor: default; }
      `}</style>
    </div>
  );
}
