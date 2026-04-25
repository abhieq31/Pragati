'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { Card, EmptyState, LifecycleTag, PriorityTag, StatusTag, TaskLink, formatDate, daysUntil } from '@/components/ui';

interface Summary {
  totalAssigned: number;
  completed: number;
  overdue: number;
  dueThisWeek: number;
  completionRate: number;
  byStatus: Record<string, number>;
}

// ── Confetti celebration ──────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function Celebration({ taskTitle, onDone }: { taskTitle: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const dots = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left: (i * 1.45) % 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + (i % 6) * 1.5,
    delay: (i * 0.025) % 0.8,
    duration: 0.9 + (i % 6) * 0.15,
    round: i % 4 !== 0,
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {dots.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.left}%`,
            top: '-12px',
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            borderRadius: d.round ? '50%' : '2px',
            animation: `confetti-fall ${d.duration}s ${d.delay}s ease-in forwards`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'celebration-pop 0.35s ease-out forwards' }}
      >
        <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 text-center max-w-xs mx-4">
          <div className="text-6xl mb-3 select-none">🎉</div>
          <div className="text-2xl font-bold text-slate-900">Task done!</div>
          <div className="text-slate-500 mt-2 text-sm line-clamp-2">"{taskTitle}"</div>
          <div className="mt-4 text-emerald-600 font-semibold text-sm">Keep the momentum going →</div>
        </div>
      </div>
    </div>
  );
}

// ── Quick-add task ────────────────────────────────────────────────────────────
function QuickAdd({ projects, currentUserId, onAdded }: { projects: any[]; currentUserId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSaving(true);
    try {
      await api('/tasks', {
        method: 'POST',
        body: { title: title.trim(), projectId, assigneeId: currentUserId, dueDate: dueDate || undefined }
      });
      setTitle('');
      setProjectId('');
      setDueDate('');
      setOpen(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-600 text-white rounded-full shadow-xl hover:bg-brand-700 active:scale-95 flex items-center justify-center text-3xl z-40 transition-all"
        title="Add a task"
      >
        +
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
      <div className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-80">
        <div className="flex justify-between items-center mb-4">
          <div className="font-semibold text-slate-800">Add a task</div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            className="input"
            placeholder="What needs to get done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select
            className="select"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Select project…</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} · ` : ''}{p.name}
              </option>
            ))}
          </select>
          <div>
            <label className="label">Due date (optional)</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving || !title.trim() || !projectId}>
            {saving ? 'Adding…' : '+ Add task'}
          </button>
        </form>
      </div>
    </>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<{ tasks: any[]; subtasks: any[] }>({ tasks: [], subtasks: [] });
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState<'open' | 'overdue' | 'done' | 'all'>('open');
  const [me, setMe] = useState<any>(null);
  const [celebrating, setCelebrating] = useState<{ id: string; title: string } | null>(null);

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
    // Optimistic
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, status: 'done' } : t) }));
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status: 'done' } });
      setCelebrating({ id: task.id, title: task.title });
      setTimeout(() => {
        setCelebrating(null);
        reload();
      }, 2900);
    } catch {
      // Revert
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, status: task.status } : t) }));
    }
  }

  const openCount = summary?.byStatus
    ? Object.entries(summary.byStatus).filter(([k]) => k !== 'done').reduce((a, [, v]) => a + v, 0)
    : 0;

  const filteredTasks = data.tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status !== 'done';
    if (filter === 'overdue') return t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date();
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const recentWins = data.tasks
    .filter((t) => t.status === 'done' && t.completedAt)
    .filter((t) => {
      const d = new Date(t.completedAt);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      return d > cutoff;
    })
    .slice(0, 5);

  const firstName = me?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-24">
      {celebrating && (
        <Celebration taskTitle={celebrating.title} onDone={() => setCelebrating(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {openCount > 0
              ? `You have ${openCount} open task${openCount !== 1 ? 's' : ''} waiting.`
              : 'All caught up! Great work today.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open tasks', value: openCount, sub: 'in your bucket' },
          { label: 'Due this week', value: summary?.dueThisWeek ?? 0, tone: 'warn', sub: 'coming up' },
          { label: 'Overdue', value: summary?.overdue ?? 0, tone: summary?.overdue ? 'bad' : 'default', sub: 'needs attention' },
          { label: 'Done', value: summary?.completed ?? 0, tone: 'good', sub: `${summary?.completionRate ?? 0}% completion` }
        ].map(({ label, value, sub, tone = 'default' }) => (
          <div key={label} className="card p-4 border-t-2 border-t-brand-500/20">
            <div className="text-[11px] font-bold uppercase tracking-widest text-brand-600/60">{label}</div>
            <div className={`text-3xl font-black mt-1 ${
              tone === 'warn' ? 'text-amber-500' :
              tone === 'bad' && value ? 'text-red-600' :
              tone === 'good' ? 'text-forest-600' :
              'text-brand-700'
            }`}>
              {value}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <Card
        title="My tasks"
        action={
          <div className="flex gap-1">
            {(['open', 'overdue', 'done', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded text-xs capitalize ${
                  filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        {filteredTasks.length === 0 ? (
          <EmptyState
            title={filter === 'open' ? 'All clear! 🎉' : 'Nothing here'}
            hint={filter === 'open' ? 'No open tasks. Tap + to add one.' : 'Try a different filter.'}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((t) => {
              const d = daysUntil(t.dueDate);
              const overdue = d !== null && d < 0 && t.status !== 'done';
              const done = t.status === 'done';
              return (
                <div key={t.id} className="py-3 flex items-center gap-3">
                  <button
                    onClick={() => !done && markDone(t)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50'
                    }`}
                    title={done ? 'Completed' : 'Mark as done'}
                    disabled={done}
                  >
                    {done && <span className="text-[10px] font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 flex-wrap ${done ? 'opacity-50' : ''}`}>
                      <TaskLink task={t} />
                      {t.gxpCritical && (
                        <span className="tag bg-red-50 text-red-700 border border-red-200 text-[10px]">GxP</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <Link href={`/projects/${t.projectId}`} className="hover:underline hover:text-brand-600">
                        {t.projectCode || t.projectName}
                      </Link>
                      {t.lifecycle && t.lifecycle !== 'generic' && (
                        <>
                          <span>·</span>
                          <LifecycleTag lifecycle={t.lifecycle} />
                        </>
                      )}
                      {t.subtaskCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{t.subtasksDone}/{t.subtaskCount} subtasks</span>
                        </>
                      )}
                    </div>
                  </div>

                  <PriorityTag priority={t.priority} />

                  <div className={`text-xs text-right w-24 shrink-0 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                    {t.dueDate ? formatDate(t.dueDate) : '—'}
                    {d !== null && !done && (
                      <div className="text-[10px]">
                        {d < 0 ? `${-d}d overdue` : d === 0 ? 'due today' : `in ${d}d`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* My subtasks (micro-tasks) */}
      {data.subtasks?.length > 0 && (
        <Card title="My micro-tasks">
          <div className="divide-y divide-slate-100">
            {data.subtasks.map((s) => (
              <div key={s.id} className="py-2 flex items-center gap-3 text-sm">
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                  s.status === 'done' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                }`}>
                  {s.status === 'done' && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={s.status === 'done' ? 'line-through text-slate-400' : ''}>{s.title}</div>
                  <div className="text-xs text-slate-400">{s.projectCode} · {s.taskTitle}</div>
                </div>
                <StatusTag status={s.status} />
                <div className="text-xs text-slate-400 w-24 text-right">{formatDate(s.dueDate)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent wins */}
      {recentWins.length > 0 && (
        <Card title="Recent wins 🏆">
          <p className="text-xs text-slate-400 mb-3">Tasks you completed in the last 7 days</p>
          <div className="space-y-2">
            {recentWins.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-700 truncate">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.projectCode || t.projectName}</div>
                </div>
                <div className="text-xs text-emerald-600 font-medium shrink-0">{formatDate(t.completedAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick-add FAB */}
      {me && (
        <QuickAdd projects={projects} currentUserId={me.id} onAdded={reload} />
      )}
    </div>
  );
}
