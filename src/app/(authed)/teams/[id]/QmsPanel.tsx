'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { Card, useToast, formatDate } from '@/components/ui';
import { FileSpreadsheet, ChevronRight } from 'lucide-react';

interface SheetSummary {
  id: string;
  changeControlNo: string;
  prNo: string;
  title: string;
  rowCount: number;
  createdByName: string;
  createdAt?: string;
  rows: { completion: number }[];
}

/**
 * Quality (QMS) module for a team — a generic quality-tracking section. Lists
 * the team's change-control records and (for leads) lets them start a new one.
 * Rendered inside the team detail page only when Team.modules.qms.enabled.
 */
export function QmsPanel({ teamId, isLead }: { teamId: string; isLead: boolean }) {
  const router = useRouter();
  const { showToast, ToastEl } = useToast();
  const [sheets, setSheets] = useState<SheetSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [ccNo, setCcNo] = useState('');
  const [prNo, setPrNo] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<SheetSummary[]>(`/csv-activity?teamId=${teamId}`)
      .then(setSheets)
      .catch(() => setSheets([]));
  }, [teamId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!ccNo.trim()) return;
    setBusy(true);
    try {
      const sheet = await api<{ id: string }>('/csv-activity', {
        method: 'POST',
        body: { teamId, changeControlNo: ccNo.trim(), prNo: prNo.trim(), title: title.trim(), rows: [] },
      });
      router.push(`/csv-activity/${sheet.id}`);
    } catch (err: any) {
      showToast(err.message || 'Could not create the sheet.', 'err');
      setBusy(false);
    }
  }

  function overall(s: SheetSummary) {
    if (!s.rows?.length) return 0;
    return Math.round(s.rows.reduce((a, r) => a + (r.completion || 0), 0) / s.rows.length);
  }

  return (
    <Card
      title="Quality tracking"
      action={
        isLead ? (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs font-bold text-brand-700 hover:text-brand-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            {creating ? 'Cancel' : '+ New record'}
          </button>
        ) : undefined
      }
    >
      {ToastEl}
      <p className="-mt-1 mb-3 text-[11px] text-slate-500 leading-snug">
        Track validation and quality status, one record per change control.
      </p>

      {creating && (
        <form
          onSubmit={create}
          className="mb-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 grid sm:grid-cols-3 gap-2"
        >
          <input
            className="input"
            placeholder="Change Control No*"
            value={ccNo}
            onChange={(e) => setCcNo(e.target.value)}
            required
            autoFocus
          />
          <input className="input" placeholder="PR No" value={prNo} onChange={(e) => setPrNo(e.target.value)} />
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" disabled={busy} className="btn-primary shrink-0">
              {busy ? '…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {sheets === null ? (
        <div className="h-16 skeleton rounded-xl" />
      ) : sheets.length === 0 ? (
        <div className="text-sm text-slate-500 py-4">
          {isLead ? 'No records yet — start one with “New record”.' : 'No quality records yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {sheets.map((s) => (
            <Link
              key={s.id}
              href={`/csv-activity/${s.id}`}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                <FileSpreadsheet size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800 truncate">{s.changeControlNo}</div>
                <div className="text-[11px] text-slate-400 truncate">
                  {s.prNo ? `PR ${s.prNo} · ` : ''}
                  {s.rowCount} format{s.rowCount === 1 ? '' : 's'} · {overall(s)}% · {formatDate(s.createdAt)}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
