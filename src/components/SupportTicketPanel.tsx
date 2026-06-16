'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client/api';
import { ticketArrow, type TicketSummary } from '@/lib/tickets';
import { Ticket, TriangleAlert, Loader2 } from 'lucide-react';

interface Entry {
  dateKey: string;
  open: number;
  logged: number;
  resolved: number;
  note: string;
  updatedAt: string | null;
}
interface Payload {
  label: string;
  today: string;
  entries: Entry[];
  summary: TicketSummary;
}

/* Minimal inline sparkline of the open-backlog series. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 132;
  const h = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`)
    .join(' ');
  const last = values[values.length - 1];
  const lastX = (values.length - 1) * step;
  const lastY = h - 3 - ((last - min) / span) * (h - 6);
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke="#1565C0"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2.4} fill="#1565C0" />
    </svg>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
        {label}
      </div>
      <div className={`text-sm font-bold ${tone || 'text-slate-800 dark:text-white/85'}`}>{value}</div>
    </div>
  );
}

export function SupportTicketPanel({
  projectId,
  initialLabel,
}: {
  projectId: string;
  initialLabel?: string;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Form fields (kept as strings for controlled number inputs).
  const [open, setOpen] = useState('');
  const [logged, setLogged] = useState('');
  const [resolved, setResolved] = useState('');
  const [note, setNote] = useState('');

  const label = data?.label || initialLabel || 'Support tickets';

  function hydrateForm(p: Payload) {
    const todayEntry = p.entries.find((e) => e.dateKey === p.today);
    setOpen(todayEntry ? String(todayEntry.open) : '');
    setLogged(todayEntry ? String(todayEntry.logged) : '');
    setResolved(todayEntry ? String(todayEntry.resolved) : '');
    setNote(todayEntry?.note || '');
  }

  useEffect(() => {
    let alive = true;
    api<Payload>(`/projects/${projectId}/tickets`)
      .then((p) => {
        if (!alive) return;
        setData(p);
        hydrateForm(p);
      })
      .catch((e) => alive && setErr(e.message || 'Failed to load'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [projectId]);

  const loggedToday = useMemo(() => !!data && data.entries.some((e) => e.dateKey === data.today), [data]);

  async function save() {
    setSaving(true);
    setErr('');
    try {
      const body = {
        open: open === '' ? undefined : Math.max(0, Math.floor(Number(open))),
        logged: logged === '' ? undefined : Math.max(0, Math.floor(Number(logged))),
        resolved: resolved === '' ? undefined : Math.max(0, Math.floor(Number(resolved))),
        note: note.trim() || undefined,
      };
      const p = await api<Payload>(`/projects/${projectId}/tickets`, { method: 'POST', body });
      setData(p);
      hydrateForm(p);
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const s = data?.summary;
  const wow =
    s && s.openWoWPct !== null
      ? `${ticketArrow(s.openWoWDelta)} ${Math.abs(s.openWoWPct)}% wk/wk`
      : s && s.direction !== 'flat'
        ? `backlog ${s.direction}`
        : 'steady';
  const wowTone =
    s && s.openWoWDelta > 0
      ? 'text-rose-600 dark:text-rose-400'
      : s && s.openWoWDelta < 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-slate-500 dark:text-white/55';

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300">
          <Ticket size={15} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white/90">{label}</h3>
          <p className="text-[11px] text-slate-400 dark:text-white/45">
            Daily count — logged each morning, rolled into reports &amp; the brief.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {/* ── Log today ─────────────────────────────────────────────── */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
              {loggedToday ? 'Today’s count (logged)' : 'Log today’s count'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { lab: 'Open', val: open, set: setOpen, hint: 'backlog' },
                { lab: 'New', val: logged, set: setLogged, hint: 'logged' },
                { lab: 'Resolved', val: resolved, set: setResolved, hint: 'closed' },
              ].map((f) => (
                <div key={f.lab}>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-white/55 mb-1">
                    {f.lab} <span className="text-slate-300 dark:text-white/30">· {f.hint}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="input text-center !px-1 tabular-nums"
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <input
              className="input mt-2 text-xs"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional) — e.g. spike from release 4.2"
              maxLength={500}
            />
            <div className="flex items-center gap-3 mt-3">
              <button onClick={save} disabled={saving} className="btn-primary !py-1.5 !text-xs">
                {saving ? 'Saving…' : loggedToday ? 'Update today' : 'Log today'}
              </button>
              {err && <span className="text-xs text-rose-600">{err}</span>}
            </div>
          </div>

          {/* ── Summary ───────────────────────────────────────────────── */}
          <div className="md:border-l md:border-slate-100 md:dark:border-white/10 md:pl-5">
            {s && s.count > 0 ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Open now
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                      {s.open}
                    </div>
                    <div className={`text-[11px] font-semibold mt-1 ${wowTone}`}>{wow}</div>
                  </div>
                  <Sparkline values={s.sparkline} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                  <Stat label="In / Out today" value={`+${s.loggedToday} / −${s.resolvedToday}`} />
                  <Stat
                    label="Net flow · 7d"
                    value={`${s.netFlow7 > 0 ? '+' : ''}${s.netFlow7}`}
                    tone={
                      s.netFlow7 > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : s.netFlow7 < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : undefined
                    }
                  />
                  <Stat label="Avg open · 7d" value={String(s.avgOpen7)} />
                  <Stat
                    label="Clears in"
                    value={s.clearEtaDays !== null ? `~${s.clearEtaDays}d` : '—'}
                    tone={s.clearEtaDays !== null ? 'text-emerald-600 dark:text-emerald-400' : undefined}
                  />
                </div>

                {s.anomaly?.isAnomalous && (
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-2.5 py-1.5">
                    <TriangleAlert size={13} className="mt-px shrink-0" />
                    <span>
                      Today’s open count is a statistical outlier vs recent days (z = {s.anomaly.z}) — worth a
                      look.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-400 dark:text-white/45 py-6 text-center">
                No readings yet. Log today’s count to start the trend.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
