'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { EmptyState, LifecycleTag, PriorityTag, TaskLink, formatDate, daysUntil } from '@/components/ui';
import { getTodaysPrinciple } from '@/lib/alp';
import { getGreeting, getCelebrationAugment, getTodaysQuote } from '@/lib/culture';
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

function Celebration({ taskTitle, isGxP, daysEarly, onDone }: {
  taskTitle: string; isGxP: boolean; daysEarly: number; onDone: () => void;
}) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const dots = Array.from({ length: 72 }, (_, i) => ({
    id: i, left: (i * 1.4) % 100, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + (i % 7) * 1.5, delay: (i * 0.022) % 0.9,
    duration: 0.85 + (i % 7) * 0.14, round: i % 3 !== 0,
  }));
  const augment = getCelebrationAugment({ daysEarly, isGxP });
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
          <div className="text-5xl mb-3 select-none">{isGxP ? '🏅' : '🎉'}</div>
          <div className="text-2xl font-black text-slate-900">
            {daysEarly >= 2 ? 'Shabash! ⚡' : isGxP ? 'Wah-wah! 🌟' : 'Task done!'}
          </div>
          <div className="text-slate-400 mt-2 text-sm line-clamp-2">"{taskTitle}"</div>
          <div className="mt-3 text-xs text-brand-600 font-medium">{augment}</div>
        </div>
      </div>
    </div>
  );
}

function DailyPrinciple() {
  const p = useMemo(() => getTodaysPrinciple(), []);
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card cursor-pointer select-none overflow-hidden"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="px-4 py-3 flex items-center gap-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: '#0B1628', color: '#64B5F6' }}
        >
          {p.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 10, letterSpacing: '0.14em' }} className="text-slate-400 uppercase font-bold">
            Principle #{p.number} · {p.title}
          </div>
          <div className="text-sm text-slate-600 truncate italic mt-0.5">"{p.tagline}"</div>
        </div>
        <div className="text-slate-300 text-xs shrink-0">{open ? '↑' : '↓'}</div>
      </div>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2.5 bg-slate-50">
          <p className="text-sm text-slate-600 leading-relaxed">{p.text}</p>
          <div className="flex gap-1.5 items-start">
            <span className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-forest-600 whitespace-nowrap">QI lens</span>
            <p className="text-xs text-slate-500 leading-relaxed">{p.qiLens}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAdd({ projects, currentUserId, onAdded }: {
  projects: any[]; currentUserId: string; onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
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
      setRaw(''); setProjectId(''); setOpen(false); onAdded();
    } finally { setSaving(false); }
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-8 right-8 w-12 h-12 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center text-2xl z-40 transition-transform"
      style={{ background: '#0B1628' }}
      title="Add a task"
    >
      +
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5" style={{ width: 340 }}>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold text-slate-800 text-sm">New task</div>
          <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500 text-lg leading-none">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <input
              autoFocus
              className="input text-sm"
              placeholder='"review IDP docs by friday" or "urgent: fix login"'
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              required
            />
            {raw.trim() && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {parsed.title !== raw.trim() && (
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    {parsed.title || '…'}
                  </span>
                )}
                {parsed.dueDate && (
                  <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {new Date(parsed.dueDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
                {parsed.priority && parsed.priority !== 'low' && (
                  <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                    {parsed.priority}
                  </span>
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
          <button
            type="submit"
            className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: '#1565C0' }}
            disabled={saving || !parsed.title.trim() || !projectId}
          >
            {saving ? 'Adding…' : 'Add task'}
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
  const [celebrating, setCelebrating] = useState<{ id: string; title: string; isGxP: boolean; daysEarly: number } | null>(null);

  const principle = useMemo(() => getTodaysPrinciple(), []);
  const { quote, author } = useMemo(() => getTodaysQuote(), []);

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
      const daysEarly = task.dueDate ? Math.max(0, daysUntil(task.dueDate) ?? 0) : 0;
      setCelebrating({ id: task.id, title: task.title, isGxP: !!task.gxpCritical, daysEarly });
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

  const { text: greetText, sub: greetSub } = me ? getGreeting(me.name) : { text: 'Welcome back', sub: '' };

  return (
    <div className="space-y-5 pb-24 max-w-3xl">
      {celebrating && (
        <Celebration taskTitle={celebrating.title} isGxP={celebrating.isGxP} daysEarly={celebrating.daysEarly} onDone={() => setCelebrating(null)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{greetText}</h1>
          {greetSub && <span style={{ fontSize: 11 }} className="text-brand-400 uppercase tracking-widest font-bold">{greetSub}</span>}
        </div>
        <p className="text-slate-400 text-sm mt-1">
          {openCount > 0
            ? overdueCount > 0
              ? `${openCount} tasks open · ${overdueCount} overdue`
              : `${openCount} task${openCount !== 1 ? 's' : ''} open`
            : 'All caught up — what will you build next?'}
        </p>
      </div>

      {/* ── Principle strip ─────────────────────────────────────────────────── */}
      <DailyPrinciple />

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open',      value: openCount,                n: null },
          { label: 'This week', value: summary?.dueThisWeek ?? 0, n: null },
          { label: 'Overdue',   value: overdueCount,             n: overdueCount > 0 ? 'red' : null },
          { label: 'Delivered', value: summary?.completed ?? 0,   n: 'green' },
        ].map(({ label, value, n }) => (
          <div key={label} className="card px-4 py-3">
            <div style={{ fontSize: 10, letterSpacing: '0.14em' }} className="text-slate-400 uppercase font-bold">{label}</div>
            <div
              className="text-3xl font-black mt-1 tracking-tight"
              style={{ color: n === 'red' ? '#ef4444' : n === 'green' ? '#22c55e' : '#0f172a' }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Task list ───────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 style={{ fontSize: 10, letterSpacing: '0.14em' }} className="text-slate-400 uppercase font-bold">My tasks</h3>
          <div className="flex gap-1">
            {(['open', 'overdue', 'done', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors"
                style={{
                  background: filter === f ? '#0B1628' : 'transparent',
                  color: filter === f ? 'white' : '#94a3b8',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            title={filter === 'open' ? 'All clear' : 'Nothing here'}
            hint={filter === 'open' ? `${principle.emptyHint} Tap + to add.` : 'Try a different filter.'}
          />
        ) : (
          <div>
            {filteredTasks.map((t, i) => {
              const d = daysUntil(t.dueDate);
              const overdue = d !== null && d < 0 && t.status !== 'done';
              const done = t.status === 'done';
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}
                >
                  {/* Check toggle */}
                  <button
                    onClick={() => !done && markDone(t)}
                    disabled={done}
                    className="shrink-0 w-4 h-4 rounded-full border transition-all flex items-center justify-center"
                    style={{
                      borderColor: done ? '#22c55e' : overdue ? '#ef4444' : '#cbd5e1',
                      background: done ? '#22c55e' : 'transparent',
                    }}
                  >
                    {done && <span className="text-white" style={{ fontSize: 8, fontWeight: 900 }}>✓</span>}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 flex-wrap ${done ? 'opacity-40' : ''}`}>
                      <TaskLink task={t} />
                      {t.gxpCritical && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">GxP</span>
                      )}
                      {t.lifecycle && t.lifecycle !== 'generic' && (
                        <LifecycleTag lifecycle={t.lifecycle} />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      <Link href={`/projects/${t.projectId}`} className="hover:text-brand-600 transition-colors">
                        {t.projectCode || t.projectName}
                      </Link>
                      {t.subtaskCount > 0 && <span className="ml-2 text-slate-300">· {t.subtasksDone}/{t.subtaskCount} subtasks</span>}
                    </div>
                  </div>

                  {/* Priority */}
                  {t.priority && t.priority !== 'low' && (
                    <PriorityTag priority={t.priority} />
                  )}

                  {/* Due date */}
                  <div className="text-right shrink-0 w-20">
                    <div className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                      {t.dueDate ? formatDate(t.dueDate) : '—'}
                    </div>
                    {d !== null && !done && (
                      <div style={{ fontSize: 10 }} className={overdue ? 'text-red-400' : 'text-slate-300'}>
                        {d < 0 ? `${-d}d late` : d === 0 ? 'today' : `${d}d`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Micro-tasks ─────────────────────────────────────────────────────── */}
      {data.subtasks?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 style={{ fontSize: 10, letterSpacing: '0.14em' }} className="text-slate-400 uppercase font-bold">
              Micro-tasks
            </h3>
          </div>
          {data.subtasks.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}
            >
              <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${s.status === 'done' ? 'border-green-500 bg-green-500' : 'border-slate-200'}`}>
                {s.status === 'done' && <span className="text-white" style={{ fontSize: 7, fontWeight: 900 }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${s.status === 'done' ? 'line-through text-slate-300' : 'text-slate-700'}`}>{s.title}</div>
                <div className="text-xs text-slate-400">{s.projectCode} · {s.taskTitle}</div>
              </div>
              <div className="text-xs text-slate-400 w-20 text-right">{formatDate(s.dueDate)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent wins ─────────────────────────────────────────────────────── */}
      {recentWins.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 style={{ fontSize: 10, letterSpacing: '0.14em' }} className="text-slate-400 uppercase font-bold">
              Delivered this week
            </h3>
          </div>
          {recentWins.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-600 truncate">{t.title}</div>
                <div className="text-xs text-slate-400">{t.projectCode || t.projectName}</div>
              </div>
              <div className="text-xs text-slate-300">{formatDate(t.completedAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quote ───────────────────────────────────────────────────────────── */}
      <div className="pt-2 pb-4 text-center">
        <p className="text-sm text-slate-300 italic max-w-md mx-auto leading-relaxed">"{quote}"</p>
        <p style={{ fontSize: 11 }} className="text-slate-300 mt-1.5">— {author}</p>
      </div>

      {me && <QuickAdd projects={projects} currentUserId={me.id} onAdded={reload} />}
    </div>
  );
}
