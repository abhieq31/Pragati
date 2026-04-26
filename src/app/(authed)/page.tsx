'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { TaskLink, formatDate, daysUntil } from '@/components/ui';
import { getGreeting } from '@/lib/culture';
import { parseNaturalInput } from '@/lib/naturalDate';
import { useToast } from '@/components/Toast';
import {
  CheckCircle2, AlertTriangle, FolderKanban, ChevronDown,
  Plus, Target, ArrowUpRight, Flame, TrendingUp, Clock,
} from 'lucide-react';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Summary {
  totalAssigned: number; completed: number; overdue: number;
  dueThisWeek: number; completionRate: number; byStatus: Record<string, number>;
}
interface OrgOverview {
  totals: { tasksOpen: number; tasksOverdue: number; activeProjects: number; users: number; doneThisMonth: number };
  projects: Array<{ id: string; name: string; code: string; status: string; taskCount: number; tasksDone: number; tasksOverdue: number; health: 'good' | 'at_risk' | 'critical'; dueDate: string | null; }>;
  attention: Array<{ severity: 'critical' | 'warn'; label: string; detail: string; href: string }>;
}

/* ── Confetti celebration ─────────────────────────────────────────────────── */
const CONFETTI = ['#1565C0','#1E88E5','#43A047','#FFA726','#EF5350','#AB47BC','#26C6DA'];
function Celebration({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const dots = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: (i * 1.7) % 100, color: CONFETTI[i % CONFETTI.length],
    size: 5 + (i % 6) * 1.5, delay: (i * 0.025) % 0.9,
    dur: 0.85 + (i % 7) * 0.14, round: i % 3 !== 0,
  }));
  return (
    <div className="fixed inset-0 z-[9980] pointer-events-none overflow-hidden">
      {dots.map(d => (
        <div key={d.id} style={{
          position: 'absolute', left: `${d.left}%`, top: '-12px',
          width: d.size, height: d.size, backgroundColor: d.color,
          borderRadius: d.round ? '50%' : '2px',
          animation: `confetti-fall ${d.dur}s ${d.delay}s ease-in forwards`,
        }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'celebration-pop 0.35s ease-out forwards' }}>
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center max-w-xs mx-4 border border-slate-100">
          <div className="text-4xl mb-3 select-none">✅</div>
          <div className="text-xl font-black text-slate-900">Done!</div>
          <div className="text-slate-400 mt-1.5 text-sm line-clamp-2">"{title}"</div>
        </div>
      </div>
    </div>
  );
}

/* ── Date helpers ─────────────────────────────────────────────────────────── */
function dayOf(s: string) { return new Date(s + 'T12:00:00'); }

function DueDateChip({ date, done }: { date: string | null; done: boolean }) {
  if (!date || done) return null;
  const d = daysUntil(date);
  const overdue = d !== null && d < 0;
  const today   = d === 0;
  const soon    = d !== null && d > 0 && d <= 2;
  const text = overdue ? `${Math.abs(d!)}d late` : today ? 'Today' : d === 1 ? 'Tomorrow' : formatDate(date);
  const color = overdue ? '#dc2626' : today ? '#d97706' : soon ? '#ea580c' : '#94a3b8';
  const bg    = overdue ? '#fee2e2' : today ? '#fef9c3' : soon ? '#fff7ed' : 'transparent';
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 transition-colors"
      style={{ color, background: bg }}>
      {overdue && <Flame size={9} className="mr-0.5" />}
      {text}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b' };
  if (!colors[priority]) return null;
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[priority] }} title={priority} />;
}

/* ── Single task row ──────────────────────────────────────────────────────── */
function TaskRow({ task, onDone, accent }: { task: any; onDone: (t: any) => void; accent?: string }) {
  const [hovered, setHovered] = useState(false);
  const done = task.status === 'done';
  const overdue = !done && task.dueDate && daysUntil(task.dueDate) !== null && daysUntil(task.dueDate)! < 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex items-center gap-3 px-4 py-3 transition-colors"
      style={{
        background: hovered ? 'var(--row-hover, rgba(0,0,0,0.02))' : 'transparent',
        borderLeft: accent ? `3px solid ${accent}` : '3px solid transparent',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => !done && onDone(task)}
        disabled={done}
        aria-label={done ? 'Completed' : 'Mark done'}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-110 focus:outline-none"
        style={{
          borderColor: done ? '#22c55e' : overdue ? '#ef4444' : hovered ? '#1565C0' : '#cbd5e1',
          background:   done ? '#22c55e' : hovered && !done ? 'rgba(21,101,192,0.06)' : 'transparent',
        }}
      >
        {done && <CheckCircle2 size={13} className="text-white" strokeWidth={3} />}
        {!done && hovered && <span className="w-2 h-2 rounded-full" style={{ background: overdue ? '#ef4444' : '#1565C0', opacity: 0.6 }} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-medium truncate transition-colors ${
              done ? 'line-through text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'
            }`}>
            <TaskLink task={task} />
          </span>
          {task.gxpCritical && (
            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded shrink-0">
              Compliance
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {(task.projectCode || task.projectName) && (
            <Link href={`/projects/${task.projectId}`}
              className="text-[10px] font-mono text-slate-400 hover:text-blue-600 transition-colors shrink-0">
              {task.projectCode || task.projectName}
            </Link>
          )}
          {task.priority && task.priority !== 'low' && (
            <span className="flex items-center gap-1">
              <PriorityDot priority={task.priority} />
              <span className="text-[10px] text-slate-400 capitalize">{task.priority}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: due date + action */}
      <div className="flex items-center gap-2 shrink-0">
        <DueDateChip date={task.dueDate} done={done} />
        {hovered && !done && (
          <Link href={`/tasks/${task.id}`}
            className="p-1 rounded text-slate-300 hover:text-blue-500 transition-colors"
            title="Open task">
            <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Task group ───────────────────────────────────────────────────────────── */
const GROUP_META = {
  overdue: { label: 'Overdue',   color: '#ef4444', bg: '#fee2e2', accent: '#ef4444' },
  today:   { label: 'Today',     color: '#1565C0', bg: '#dbeafe', accent: '#3b82f6' },
  week:    { label: 'This Week', color: '#7c3aed', bg: '#ede9fe', accent: '#8b5cf6' },
  later:   { label: 'Later',     color: '#475569', bg: '#f1f5f9', accent: undefined  },
  done:    { label: 'Done',      color: '#22c55e', bg: '#dcfce7', accent: undefined  },
} as const;
type GroupKey = keyof typeof GROUP_META;

function TaskGroup({
  id, tasks, onDone, defaultOpen = true,
  onAdd,
}: {
  id: GroupKey; tasks: any[]; onDone: (t: any) => void;
  defaultOpen?: boolean; onAdd?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = GROUP_META[id];
  if (tasks.length === 0 && id !== 'today') return null;

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-black/[0.02] transition-colors"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
          {meta.label}
        </span>
        {tasks.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
            {tasks.length}
          </span>
        )}
        <div className="flex-1 h-px" style={{ background: meta.color + '22' }} />
        <ChevronDown size={12} style={{ color: meta.color, transform: open ? undefined : 'rotate(-90deg)', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Rows */}
      {open && (
        <div>
          {tasks.length === 0 ? (
            <div className="px-4 py-4 flex items-center gap-2 text-slate-400">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-sm">Nothing due today — great job!</span>
              {onAdd && (
                <button onClick={onAdd} className="ml-auto text-xs text-blue-600 font-semibold hover:underline">
                  + Add task
                </button>
              )}
            </div>
          ) : (
            tasks.map((t, i) => (
              <div key={t.id} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined }}>
                <TaskRow task={t} onDone={onDone} accent={meta.accent} />
              </div>
            ))
          )}
          {tasks.length > 0 && id !== 'done' && onAdd && (
            <button onClick={onAdd}
              className="w-full flex items-center gap-2 px-5 py-2 text-slate-300 hover:text-slate-500 hover:bg-black/[0.02] transition-colors text-left">
              <Plus size={12} />
              <span className="text-xs">Add task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline quick-add ─────────────────────────────────────────────────────── */
function InlineAdd({ projects, userId, onAdded, inputRef: extRef }: {
  projects: any[]; userId: string; onAdded: () => void; inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const toast = useToast();
  const [raw, setRaw]           = useState('');
  const [projectId, setPId]     = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = (extRef || localRef) as React.RefObject<HTMLInputElement>;
  const parsed = useMemo(() => parseNaturalInput(raw), [raw]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!parsed.title.trim() || !projectId) return;
    setSaving(true);
    try {
      await api('/tasks', { method: 'POST', body: {
        title: parsed.title.trim(), projectId, assigneeId: userId,
        dueDate: parsed.dueDate || undefined,
        priority: parsed.priority || undefined,
      }});
      toast.success('Task created', parsed.title.trim().slice(0, 48));
      setRaw(''); setPId(''); setExpanded(false); onAdded();
    } catch (err: any) {
      toast.error('Failed to create task', err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="border-t border-slate-100" style={{ background: expanded ? 'rgba(21,101,192,0.03)' : 'transparent', transition: 'background 0.2s ease' }}>
      {!expanded ? (
        <button
          onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 40); }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-slate-400 hover:text-slate-600 hover:bg-black/[0.02] transition-colors"
        >
          <Plus size={14} className="shrink-0" />
          <span className="text-sm">Add task</span>
          <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 text-slate-300">N</kbd>
        </button>
      ) : (
        <form onSubmit={submit} className="px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Plus size={14} className="text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              value={raw}
              onChange={e => setRaw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setExpanded(false); setRaw(''); } }}
              placeholder='"review docs by friday" or "urgent: fix login"'
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              autoFocus
            />
          </div>
          {/* Parsed preview chips */}
          {raw.trim() && (
            <div className="flex flex-wrap items-center gap-1.5 pl-6">
              {parsed.title !== raw.trim() && parsed.title && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{parsed.title.slice(0, 40)}</span>
              )}
              {parsed.dueDate && (
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {new Date(parsed.dueDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
              {parsed.priority && parsed.priority !== 'low' && (
                <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium capitalize">{parsed.priority}</span>
              )}
            </div>
          )}
          {/* Project selector + actions */}
          <div className="flex items-center gap-2 pl-6">
            <select value={projectId} onChange={e => setPId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:border-blue-400 transition-colors flex-1 max-w-[200px]">
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ''}{p.name}</option>)}
            </select>
            <button type="submit" disabled={saving || !parsed.title.trim() || !projectId}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-40"
              style={{ background: '#1565C0' }}>
              {saving ? 'Adding…' : 'Add ↵'}
            </button>
            <button type="button" onClick={() => { setExpanded(false); setRaw(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── Project health (PM sidebar) ──────────────────────────────────────────── */
const HEALTH_C = { good: '#22c55e', at_risk: '#f59e0b', critical: '#ef4444' };
function ProjectHealthPanel({ projects }: { projects: OrgOverview['projects'] }) {
  const active = projects.filter(p => p.status === 'in_progress').slice(0, 6);
  if (!active.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <FolderKanban size={14} className="text-blue-500" /> Project Health
        </h3>
        <Link href="/org" className="text-xs text-blue-600 hover:underline">All →</Link>
      </div>
      <div className="divide-y divide-slate-50">
        {active.map(p => {
          const pct = p.taskCount ? Math.round((p.tasksDone / p.taskCount) * 100) : 0;
          return (
            <Link key={p.id} href={`/projects/${p.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: HEALTH_C[p.health] }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-700 truncate group-hover:text-blue-700 transition-colors">{p.code || p.name}</div>
                <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: HEALTH_C[p.health] }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold" style={{ color: HEALTH_C[p.health] }}>{pct}%</div>
                {p.tasksOverdue > 0 && <div style={{ fontSize: 9 }} className="text-red-400 font-medium">{p.tasksOverdue} late</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Attention panel (PM sidebar) ─────────────────────────────────────────── */
function AttentionPanel({ items }: { items: OrgOverview['attention'] }) {
  if (!items.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-red-500" /> Needs Attention
        </h3>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{items.length}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {items.slice(0, 5).map((a, i) => (
          <Link key={i} href={a.href}
            className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors">
            <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : 'bg-amber-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-700 truncate">{a.label}</div>
              <div style={{ fontSize: 10 }} className="text-slate-400 mt-0.5">{a.detail}</div>
            </div>
            <ChevronDown size={12} className="text-slate-300 shrink-0 mt-0.5 -rotate-90" />
          </Link>
        ))}
      </div>
      {items.length > 5 && (
        <div className="px-4 py-2 border-t border-slate-50">
          <Link href="/org" className="text-xs text-blue-600 hover:underline">+{items.length - 5} more →</Link>
        </div>
      )}
    </div>
  );
}

/* ── Recent wins (right sidebar) ──────────────────────────────────────────── */
function RecentWins({ tasks }: { tasks: any[] }) {
  const wins = tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt) > new Date(Date.now() - 7 * 86400000)).slice(0, 5);
  if (!wins.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Target size={14} className="text-green-500" /> This Week's Wins
        </h3>
        <span className="text-xs text-green-600 font-bold">{wins.length}</span>
      </div>
      {wins.map((t, i) => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
          style={{ borderTop: i > 0 ? '1px solid #f8fafc' : undefined }}>
          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={10} className="text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-600 truncate">{t.title}</div>
            <div style={{ fontSize: 10 }} className="text-slate-400 font-mono">{t.projectCode || t.projectName}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData]       = useState<{ tasks: any[]; subtasks: any[] }>({ tasks: [], subtasks: [] });
  const [projects, setProjects] = useState<any[]>([]);
  const [org, setOrg]         = useState<OrgOverview | null>(null);
  const [me, setMe]           = useState<any>(null);
  const [celebrating, setCelebrating] = useState<{ id: string; title: string } | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    api<Summary>('/me/summary').then(setSummary);
    api<{ tasks: any[]; subtasks: any[] }>('/me/tasks').then(setData);
  }, []);

  useEffect(() => {
    reload();
    api('/auth/me').then((d: any) => {
      setMe(d.user);
      if (d.user?.role === 'pm') {
        api<OrgOverview>('/analytics/org/overview').then(setOrg).catch(() => {});
      }
    });
    api('/projects').then(setProjects);
  }, [reload]);

  /* 'N' keyboard shortcut to focus add input */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.shiftKey &&
          !['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        addRef.current?.click();
        addRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Mark done */
  async function markDone(task: any) {
    if (task.status === 'done') return;
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, status: 'done' } : t) }));
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status: 'done' } });
      setCelebrating({ id: task.id, title: task.title });
      setTimeout(() => { setCelebrating(null); reload(); }, 3100);
    } catch {
      setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t) }));
      toast.error('Could not mark task done');
    }
  }

  /* Group tasks by time context */
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(startOfDay.getTime() + 86400000);
  const endOfWeek  = new Date(startOfDay.getTime() + (7 - now.getDay() || 7) * 86400000);

  const openTasks   = data.tasks.filter(t => t.status !== 'done');
  const overdueTasks = openTasks.filter(t => t.dueDate && dayOf(t.dueDate) < startOfDay);
  const todayTasks   = openTasks.filter(t => t.dueDate && dayOf(t.dueDate) >= startOfDay && dayOf(t.dueDate) < endOfDay);
  const weekTasks    = openTasks.filter(t => t.dueDate && dayOf(t.dueDate) >= endOfDay && dayOf(t.dueDate) <= endOfWeek);
  const laterTasks   = openTasks.filter(t => !t.dueDate || dayOf(t.dueDate) > endOfWeek);
  const doneTasks    = data.tasks.filter(t => t.status === 'done');

  const openCount     = openTasks.length;
  const overdueCount  = overdueTasks.length;
  const rate          = summary?.completionRate ?? 0;
  const isPM          = me?.role === 'pm';

  const { text: greet } = me ? getGreeting(me.name) : { text: 'Welcome back' };
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function focusAdd() {
    const el = document.querySelector('[data-inline-add]') as HTMLElement | null;
    el?.click();
    setTimeout(() => (document.querySelector('[data-add-input]') as HTMLInputElement | null)?.focus(), 60);
  }

  return (
    <div className="pb-20 max-w-5xl">
      {celebrating && <Celebration title={celebrating.title} onDone={() => setCelebrating(null)} />}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between pt-1 mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{greet}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{todayLabel}</p>
        </div>
        <button onClick={focusAdd}
          className="btn-primary text-xs shrink-0 gap-1.5">
          <Plus size={13} /> New task
          <kbd className="font-mono text-[9px] opacity-60 border border-white/30 rounded px-1 ml-0.5">N</kbd>
        </button>
      </div>

      {/* ── Summary bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Flame size={11} /> {overdueCount} overdue
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: todayTasks.length > 0 ? '#dbeafe' : '#f1f5f9', color: todayTasks.length > 0 ? '#1565C0' : '#64748b' }}>
          <Clock size={11} /> {todayTasks.length} today
        </span>
        <span className="text-xs text-slate-400">{openCount} open</span>
        <div className="flex items-center gap-2 ml-auto">
          <div className="h-1.5 w-28 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${rate}%`, background: rate >= 80 ? '#22c55e' : rate >= 50 ? '#3b82f6' : '#f59e0b' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: rate >= 80 ? '#16a34a' : rate >= 50 ? '#1565C0' : '#d97706' }}>
            {rate}%
          </span>
          <span className="text-xs text-slate-400">done</span>
        </div>
      </div>

      {/* ── 2-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

        {/* ── Left: task groups ──────────────────────────────────────────── */}
        <div>
          <div className="card overflow-hidden divide-y divide-slate-50/80">

            <TaskGroup id="overdue" tasks={overdueTasks} onDone={markDone} />
            <TaskGroup id="today"   tasks={todayTasks}   onDone={markDone} defaultOpen onAdd={focusAdd} />
            <TaskGroup id="week"    tasks={weekTasks}     onDone={markDone} />
            <TaskGroup id="later"   tasks={laterTasks}    onDone={markDone} />

            {/* Inline add */}
            {me && (
              <InlineAdd
                projects={projects}
                userId={me.id}
                onAdded={reload}
                inputRef={addRef}
              />
            )}

            <TaskGroup id="done" tasks={doneTasks} onDone={markDone} defaultOpen={false} />
          </div>

          {/* Subtasks */}
          {data.subtasks?.length > 0 && (
            <div className="card overflow-hidden mt-4">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  Sub-tasks
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{data.subtasks.length}</span>
                </h3>
              </div>
              {data.subtasks.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid #f8fafc' : undefined }}>
                  <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${s.status === 'done' ? 'border-green-500 bg-green-500' : 'border-slate-200'}`}>
                    {s.status === 'done' && <CheckCircle2 size={9} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${s.status === 'done' ? 'line-through text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>{s.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.projectCode} · {s.taskTitle}</div>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">{formatDate(s.dueDate)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* PM-only org panels */}
          {isPM && org && <ProjectHealthPanel projects={org.projects} />}
          {isPM && org && org.attention.length > 0 && <AttentionPanel items={org.attention} />}

          {/* Recent wins — all users */}
          <RecentWins tasks={data.tasks} />

          {/* PM org totals */}
          {isPM && org && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-500" /> Org Today
                </h3>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                {[
                  { label: 'Active projects', value: org.totals.activeProjects, color: '#1565C0' },
                  { label: 'Open tasks', value: org.totals.tasksOpen, color: '#0f172a' },
                  { label: 'Overdue tasks', value: org.totals.tasksOverdue, color: org.totals.tasksOverdue > 0 ? '#dc2626' : '#0f172a' },
                  { label: 'Done this month', value: org.totals.doneThisMonth, color: '#15803d' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, color: '#94a3b8' }} className="uppercase tracking-wide font-semibold">{s.label}</div>
                    <div className="text-xl font-black" style={{ color: s.color }}>{s.value ?? '—'}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <Link href="/org" className="text-xs text-blue-600 font-semibold hover:underline">Open Command Centre →</Link>
              </div>
            </div>
          )}

          {/* Empty sidebar for IC */}
          {!isPM && openTasks.length === 0 && doneTasks.length === 0 && (
            <div className="card px-4 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Target size={18} className="text-blue-400" />
              </div>
              <div className="text-sm font-semibold text-slate-700">Your board is empty</div>
              <div className="text-xs text-slate-400 mt-1 mb-3">Ask your PM to assign tasks, or create your own.</div>
              <button onClick={focusAdd} className="btn-primary text-xs w-full justify-center">
                <Plus size={12} /> Add first task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
