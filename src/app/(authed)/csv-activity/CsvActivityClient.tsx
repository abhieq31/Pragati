'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { useToast, formatDate, EmptyState } from '@/components/ui';
import { useIsLead } from '@/components/CurrentUserContext';
import { Plus, FileSpreadsheet, X } from 'lucide-react';

interface SheetSummary {
  id: string;
  changeControlNo: string;
  prNo: string;
  title: string;
  rowCount: number;
  createdByName: string;
  createdAt?: string;
}

export default function CsvActivityClient({ initialSheets }: { initialSheets: SheetSummary[] }) {
  const isLead = useIsLead();
  const router = useRouter();
  const { showToast, ToastEl } = useToast();
  const [sheets, setSheets] = useState<SheetSummary[]>(initialSheets);
  const [creating, setCreating] = useState(false);
  const [ccNo, setCcNo] = useState('');
  const [prNo, setPrNo] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!ccNo.trim()) return;
    setBusy(true);
    try {
      const sheet = await api<{ id: string }>('/csv-activity', {
        method: 'POST',
        body: { changeControlNo: ccNo.trim(), prNo: prNo.trim(), title: title.trim(), rows: [] },
      });
      router.push(`/csv-activity/${sheet.id}`);
    } catch (err: any) {
      showToast(err.message || 'Could not create the sheet.', 'err');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {ToastEl}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="page-title">CSV Activity</h1>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
            Track Computer System Validation document status per Change Control — the digital version of
            the IDP team&apos;s Excel sheet.
          </p>
        </div>
        {isLead && (
          <button onClick={() => setCreating(true)} className="btn-primary gap-2 shrink-0">
            <Plus size={15} /> New sheet
          </button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={create}
          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-white/80">New CSV activity sheet</h2>
            <button type="button" onClick={() => setCreating(false)} aria-label="Cancel">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Change Control No*
              </span>
              <input
                className="input"
                placeholder="C/CC/PCC/2026/0765"
                value={ccNo}
                onChange={(e) => setCcNo(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                PR No
              </span>
              <input
                className="input"
                placeholder="108743"
                value={prNo}
                onChange={(e) => setPrNo(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Title
              </span>
              <input
                className="input"
                placeholder="Optional description"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Creating…' : 'Create & open'}
            </button>
          </div>
        </form>
      )}

      {sheets.length === 0 ? (
        <EmptyState
          title="No CSV activity sheets yet"
          hint={isLead ? 'Create one to start tracking validation documents per Change Control.' : 'Ask a lead to create the first sheet.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sheets.map((s) => (
            <Link
              key={s.id}
              href={`/csv-activity/${s.id}`}
              className="group rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                  <FileSpreadsheet size={17} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-white/80 truncate">
                    {s.changeControlNo}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {s.prNo ? `PR ${s.prNo} · ` : ''}
                    {s.rowCount} format{s.rowCount === 1 ? '' : 's'}
                  </div>
                  {s.title && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{s.title}</div>}
                  <div className="text-[11px] text-slate-400 mt-2">
                    {s.createdByName ? `${s.createdByName} · ` : ''}
                    {formatDate(s.createdAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
