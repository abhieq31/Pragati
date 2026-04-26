'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { LifecycleTag, PriorityTag, TaskLink, StatusTag, formatDate, daysUntil } from '@/components/ui';
import { getGreeting } from '@/lib/culture';
import { parseNaturalInput } from '@/lib/naturalDate';

interface Summary {
  totalAssigned: number;
  completed: number;
  overdue: number;
  dueThisWeek: number;
  completionRate: number;
  byStatus: Record<string, number>;
}

const CONFETTI_COLORS = ['#1565C0','#1E88E5','#43A047','#388E3C','#FFA726','#EF5350','#AB47BC','#26C6DA'];

function Celebration({ taskTitle, onDone }: { taskTitle: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const dots = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: (i * 1.7) % 100, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + (i % 6) * 1.5, delay: (i * 0.025) % 0.9,
    duration: 0.85 + (i % 7) * 0.14, round: i % 3 !== 0,
  }));
  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {dots.map((d) => (
        <div key={d.id} style={{
          position: 'absolute', left: `${d.left}%`, top: '-12px',
          width: d.size, height: d.size, backgroundColor: d.color,
          borderRadius: d.round ? '50%' : '2px',
          animation: `confetti-fall ${d.duration}s ${d.delay}s ease-in forwards`,
        }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'celebration-pop 0.35s ease-out forwards' }}>
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center max-w-xs mx-4 border border-slate-100">
          <div className="text-4xl mb-3 select-none">✅</div>
          <div className="text-xl font-black text-slate-900">Task Completed</div>
          <div className="text-slate-400 mt-2 text-sm line-clamp-2">"{taskTitle}"</div>
        </div>
      </div>
    </div>
  );
}

function QuickAdd({ projects, currentUserId, onAdded, open, onClose }: {
  projects: any[]; currentUserId: string; onAdded: () => void;
  open: boolean; onClose: () => void;
}) {
  const [raw, setRaw] = useState('');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const parsed = useMemo(() => parseNaturalInput(raw), [raw]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.title.trim() || !projectId) return;
    setSaving(true);
    try {
      await api('/tasks', { method: 'POST', body: {
        title: parsed.title.trim(), projectId,
        assigneeId: currentUserId,
        dueDate: parsed.dueDate || undefined,
        priority: parsed.priority || undefined,
      }});
      setRaw(''); setProjectId(''); onClose(); onAdded();
    } finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 p-5" style={{ width: 380 }}>
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-slate-800">Create task</div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 text-lg leading-none">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <input autoFocus className="input text-sm"
              placeholder='"review IDP docs by friday" or "urgent: fix login"'
              value={raw} onChange={(e) => setRaw(e.target.value)} required />
            {raw.trim() && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {parsed.title !== raw.trim() && (
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{parsed.title || '…'}</span>
                )}
                {parsed.dueDate && (
                  <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {new Date(parsed.dueDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
                {parsed.priority && parsed.priority !== 'low' && (
                  <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">{parsed.priority}</span>
                )}
              </div>
            )}
          </div>
          <select className="select text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="">Select project…</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ''}{p.name}</option>
            ))}
          </select>
          <button type="submit"
            className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: '#1565C0' }}
            disabled={saving || !parsed.title.trim() || !projectId}>
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </form>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<{ tasks: any[]; subtasks: any[] }>({ tasks: [], subtasks: [] });
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<'open' | 'overdue' | 'done' | 'all'>('open');
  const [me, setMe] = useState<any>(null);
  const [celebrating, setCelebrating] = useState<{ id: string; title: string } | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const reload = useCallback(() => {
    api<Summary>('/me/summary').then(setSummary);
    api<{ tasks: any[]; subtasks: any[] }>('/me/tasks').then(setData);
  }, []);

  useEffect(() => {
    reload();
    api('/auth/me').then((d: any) => setMe(d.user));
    api('/projects').then(setProjects);
  }, [reload]);

  async function markDone(task: any) {
    if (task.status === 'done') return;
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, status: 'done' } : t) }));
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status: 'done' } });
      setCelebrating({ id: task.id, title: task.title });
      setTimeout(() => { setCelebrating(null); reload(); }, 3100);
    } catch {
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, status: task.status } : t) }));
    }
  }

  const openCount = summary?.byStatus
    ? Object.entries(summary.byStatus).filter(([k]) => k !== 'done').reduce((a, [, v]) => a + v, 0)
    : 0;
  const overdueCount = summary?.overdue ?? 0;

  const filteredTasks = data.tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status !== 'done';
    if (filter === 'overdue') return t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date();
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const recentWins = data.tasks
    .filter((t) => t.status === 'done' && t.completedAt)
    .filter((t) => new Date(t.completedAt) > new Date(Date.now() - 7 * 86400000))
    .slice(0, 5);

  const { text: greetText } = me ? getGreeting(me.name) : { text: 'Welcome back' };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 pb-24 max-w-4xl">
      {celebrating && <Celebration taskTitle={celebrating.title} onDone={() => setCelebrating(null)} />}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{greetText}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="btn-primary text-xs"
          style={{ background: '#1565C0' }}
        >
          + Create task
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open',         value: openCount,                 color: '#0f172a', bg: '#fff',     border: '#e2e8f0' },
          { label: 'Due this week',value: summary?.dueThisWeek ?? 0, color: '#1565C0', bg: '#EFF6FF',  border: '#BFDBFE' },
          { label: 'Overdue',      value: overdueCount,              color: overdueCount > 0 ? '#dc2626' : '#0f172a', bg: overdueCount > 0 ? '#FEF2F2' : '#fff', border: overdueCount > 0 ? '#FECACA' : '#e2e8f0' },
          { label: 'Completed',    value: summary?.completed ?? 0,   color: '#15803d', bg: '#F0FDF4',  border: '#BBF7D0' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-xl px-4 py-3 border" style={{ background: bg, borderColor: border }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em' }} className="text-slate-500 font-medium">{label}</div>
            <div className="text-3xl font-black mt-1 tracking-tight" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── My Work Items (Jira-style table) ─────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-sm font-semibold text-slate-700">My Work Items</h3>
          <div className="flex items-center gap-1">
            {(['open', 'overdue', 'done', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors capitalize"
                style={{
                  background: filter === f ? '#1565C0' : 'transparent',
                  color: filter === f ? '#fff' : '#94a3b8',
                }}>
                {f === 'open' ? `Open (${openCount})` : f === 'overdue' ? `Overdue (${overdueCount})` : f === 'done' ? 'Done' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        {filteredTasks.length > 0 && (
          <div className="grid px-4 py-2 border-b border-slate-100 bg-slate-50/40"
               style={{ gridTemplateColumns: '20px 1fr 110px 90px 80px 80px', gap: '0 12px' }}>
            <div />
            <div style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold">Summary</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold">Project</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold">Type</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold">Priority</div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold text-right">Due</div>
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-slate-400 text-sm font-medium">
              {filter === 'open' ? 'No open tasks' : filter === 'overdue' ? 'No overdue tasks' : 'No tasks found'}
            </div>
            <div className="text-slate-300 text-xs mt-1">
              {filter === 'open' ? 'All work items are up to date.' : 'Try changing the filter above.'}
            </div>
          </div>
        ) : (
          <div>
            {filteredTasks.map((t, i) => {
              const d = daysUntil(t.dueDate);
              const overdue = d !== null && d < 0 && t.status !== 'done';
              const done = t.status === 'done';
              return (
                <div key={t.id}
                  className="grid items-center px-4 py-2.5 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '20px 1fr 110px 90px 80px 80px', gap: '0 12px', borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>

                  {/* Check toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); !done && markDone(t); }}
                    disabled={done}
                    className="w-4 h-4 rounded-full border transition-all flex items-center justify-center shrink-0"
                    style={{
                      borderColor: done ? '#22c55e' : overdue ? '#ef4444' : '#cbd5e1',
                      background: done ? '#22c55e' : 'transparent',
                    }}>
                    {done && <span className="text-white" style={{ fontSize: 8, fontWeight: 900 }}>✓</span>}
                  </button>

                  {/* Title */}
                  <div className={done ? 'opacity-40' : ''}>
                    <div className="flex items-center gap-2">
                      <TaskLink task={t} />
                      {t.gxpCritical && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">GxP</span>
                      )}
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <Link href={`/projects/${t.projectId}`}
                      className="text-xs text-slate-500 hover:text-blue-700 font-mono truncate block transition-colors">
                      {t.projectCode || t.projectName || '—'}
                    </Link>
                  </div>

                  {/* Lifecycle type */}
                  <div>
                    {t.lifecycle && t.lifecycle !== 'generic'
                      ? <LifecycleTag lifecycle={t.lifecycle} />
                      : <span className="text-xs text-slate-300">—</span>}
                  </div>

                  {/* Priority */}
                  <div>
                    {t.priority && t.priority !== 'low'
                      ? <PriorityTag priority={t.priority} />
                      : <span className="text-xs text-slate-300">—</span>}
                  </div>

                  {/* Due date */}
                  <div className="text-right">
                    <div className={`text-xs font-medium ${overdue ? 'text-red-600' : done ? 'text-slate-300' : 'text-slate-500'}`}>
                      {t.dueDate ? formatDate(t.dueDate) : '—'}
                    </div>
                    {d !== null && !done && (
                      <div style={{ fontSize: 10 }} className={overdue ? 'text-red-400' : 'text-slate-300'}>
                        {d < 0 ? `${-d}d overdue` : d === 0 ? 'today' : `in ${d}d`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer row */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">{filteredTasks.length} item{filteredTasks.length !== 1 ? 's' : ''}</span>
          <Link href="/projects" className="text-xs text-blue-700 font-medium hover:underline">View all projects →</Link>
        </div>
      </div>

      {/* ── Sub-tasks ────────────────────────────────────────────────────── */}
      {data.subtasks?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <h3 className="text-sm font-semibold text-slate-700">Sub-tasks</h3>
          </div>
          <div className="grid px-4 py-2 border-b border-slate-100 bg-slate-50/40"
               style={{ gridTemplateColumns: '16px 1fr 150px 80px', gap: '0 12px' }}>
            <div />
            {['Summary', 'Parent task', 'Due'].map((h) => (
              <div key={h} style={{ fontSize: 10, letterSpacing: '0.08em' }} className="text-slate-400 uppercase font-semibold">{h}</div>
            ))}
          </div>
          {data.subtasks.map((s, i) => (
            <div key={s.id}
              className="grid items-center px-4 py-2.5 hover:bg-blue-50/30 transition-colors"
              style={{ gridTemplateColumns: '16px 1fr 150px 80px', gap: '0 12px', borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
              <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${s.status === 'done' ? 'border-green-500 bg-green-500' : 'border-slate-200'}`}>
                {s.status === 'done' && <span className="text-white" style={{ fontSize: 7, fontWeight: 900 }}>✓</span>}
              </div>
              <div className={`text-sm truncate ${s.status === 'done' ? 'line-through text-slate-300' : 'text-slate-700'}`}>{s.title}</div>
              <div className="text-xs text-slate-400 font-mono truncate">{s.projectCode} · {s.taskTitle}</div>
              <div className="text-xs text-slate-400 text-right">{formatDate(s.dueDate)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recently completed ───────────────────────────────────────────── */}
      {recentWins.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Completed this week</h3>
            <span className="text-xs text-slate-400">{recentWins.length} item{recentWins.length !== 1 ? 's' : ''}</span>
          </div>
          {recentWins.map((t, i) => (
            <div key={t.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
              <div className="w-4 h-4 rounded-full border border-green-400 bg-green-400 flex items-center justify-center shrink-0">
                <span className="text-white" style={{ fontSize: 8, fontWeight: 900 }}>✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 truncate">{t.title}</div>
                <div className="text-xs text-slate-400 font-mono">{t.projectCode || t.projectName}</div>
              </div>
              <div className="text-xs text-slate-400 shrink-0">{formatDate(t.completedAt)}</div>
            </div>
          ))}
        </div>
      )}

      {me && <QuickAdd projects={projects} currentUserId={me.id} onAdded={reload} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}
