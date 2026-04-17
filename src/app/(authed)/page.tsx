'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import {
  Card,
  EmptyState,
  LifecycleTag,
  PriorityTag,
  StatusTag,
  TaskLink,
  formatDate,
  daysUntil
} from '@/components/ui';
import { useToasts } from '@/components/Toasts';

interface Summary {
  totalAssigned: number;
  completed: number;
  overdue: number;
  dueThisWeek: number;
  completionRate: number;
  byStatus: Record<string, number>;
}

function StatCard({
  label,
  value,
  sub,
  tone = 'default'
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: 'default' | 'warn' | 'bad' | 'good';
}) {
  const toneMap = {
    default: 'text-slate-900',
    warn: 'text-amber-600',
    bad: 'text-red-600',
    good: 'text-emerald-600'
  };
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${toneMap[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// ---------- task row ----------
function TaskRow({
  t,
  onToggled
}: {
  t: any;
  onToggled: (wasDone: boolean) => void;
}) {
  const [status, setStatus] = useState<string>(t.status);
  const [animating, setAnimating] = useState(false);
  const d = daysUntil(t.dueDate);
  const overdue = d !== null && d < 0 && status !== 'done';
  const subPct =
    t.subtaskCount > 0 ? Math.round((t.subtasksDone / t.subtaskCount) * 100) : null;

  async function toggle() {
    const wasDone = status === 'done';
    const newStatus = wasDone ? 'todo' : 'done';
    setStatus(newStatus);
    if (newStatus === 'done') {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    }
    try {
      await api(`/tasks/${t.id}`, { method: 'PATCH', body: { status: newStatus } });
      onToggled(wasDone);
    } catch {
      setStatus(status); // revert
    }
  }

  return (
    <div className="py-2.5 flex items-center gap-3 group hover:bg-slate-50 -mx-2 px-2 rounded">
      <button
        onClick={toggle}
        aria-label={status === 'done' ? 'Mark as open' : 'Mark as done'}
        className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          status === 'done'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 hover:border-brand-500'
        } ${animating ? 'animate-pop' : ''}`}
      >
        {status === 'done' && (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskLink task={t}>
            <span className={status === 'done' ? 'line-through text-slate-400' : ''}>
              {t.title}
            </span>
          </TaskLink>
          {t.gxpCritical && (
            <span className="tag bg-red-50 text-red-700 border border-red-200">GxP</span>
          )}
          {t.requiresQaSignoff && (
            <span className="tag bg-purple-50 text-purple-700 border border-purple-200">
              QA sign-off
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
          <Link href={`/projects/${t.projectId}`} className="hover:underline">
            {t.projectCode} · {t.projectName}
          </Link>
          {t.lifecycle && (
            <>
              <span>·</span>
              <LifecycleTag lifecycle={t.lifecycle} />
            </>
          )}
          {subPct !== null && (
            <>
              <span>·</span>
              <span>
                {t.subtasksDone}/{t.subtaskCount} subtasks
              </span>
            </>
          )}
        </div>
      </div>
      <PriorityTag priority={t.priority} />
      <div
        className={`text-xs w-24 text-right ${
          overdue ? 'text-red-600 font-semibold' : 'text-slate-500'
        }`}
      >
        {t.dueDate ? formatDate(t.dueDate) : '—'}
        {d !== null && status !== 'done' && (
          <div className="text-[11px]">
            {d < 0 ? `${-d}d overdue` : d === 0 ? 'due today' : `in ${d}d`}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<{ tasks: any[]; subtasks: any[] }>({ tasks: [], subtasks: [] });
  const [me, setMe] = useState<any>(null);
  const [doneToday, setDoneToday] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const toasts = useToasts();

  async function load() {
    const [s, d, st] = await Promise.all([
      api<Summary>('/me/summary'),
      api<{ tasks: any[]; subtasks: any[] }>('/me/tasks'),
      api<any>('/stats')
    ]);
    setSummary(s);
    setData(d);
    setStats(st);
    // count tasks with completedAt === today
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
    const count = (d.tasks || []).filter((x) => {
      if (!x.completedAt) return false;
      const c = new Date(x.completedAt);
      return `${c.getFullYear()}-${c.getMonth()}-${c.getDate()}` === todayStr;
    }).length;
    setDoneToday(count);
  }

  useEffect(() => {
    load();
    api('/auth/me').then((d: any) => setMe(d.user));
  }, []);

  // classify tasks into Today / This Week / Later / No Date
  const buckets = useMemo(() => {
    const today: any[] = [];
    const week: any[] = [];
    const later: any[] = [];
    const undated: any[] = [];
    const done: any[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now.getTime() + 86400000);
    const endOfWeek = new Date(now.getTime() + 7 * 86400000);

    for (const t of data.tasks || []) {
      if (t.status === 'done') {
        done.push(t);
        continue;
      }
      if (!t.dueDate) {
        undated.push(t);
        continue;
      }
      const d = new Date(t.dueDate);
      if (d < endOfToday) today.push(t);
      else if (d < endOfWeek) week.push(t);
      else later.push(t);
    }
    return { today, week, later, undated, done };
  }, [data.tasks]);

  const openCount =
    buckets.today.length +
    buckets.week.length +
    buckets.later.length +
    buckets.undated.length;

  function onToggled(wasDone: boolean) {
    if (!wasDone) {
      const msgs = [
        'Nice — one less thing.',
        'Ticked off.',
        'Great — keep going!',
        'Clean kill.',
        'Done 🎉'
      ];
      toasts.celebrate(msgs[Math.floor(Math.random() * msgs.length)]);
      setDoneToday((n) => n + 1);
    }
    // refetch summary counts in background
    api<Summary>('/me/summary').then(setSummary);
  }

  const isFreshInstall =
    stats && stats.applications === 0 && stats.projects === 0 && stats.tasks === 0;
  const isAdmin = me?.role === 'admin';

  async function loadDemo() {
    setLoadingDemo(true);
    try {
      await api('/demo/seed', { method: 'POST' });
      toasts.push({ kind: 'success', message: 'Demo data loaded. Take a look around!' });
      await load();
    } catch (e: any) {
      toasts.push({ kind: 'error', message: e.message || 'Could not load demo data' });
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {me?.name?.split(' ')[0] || 'there'}</h1>
          <p className="text-sm text-slate-500">
            {doneToday > 0
              ? `You've closed ${doneToday} task${doneToday === 1 ? '' : 's'} today 🎯`
              : 'Everything on your plate — at a glance.'}
          </p>
        </div>
      </div>

      {isFreshInstall && (
        <Card>
          <div className="py-4 text-center space-y-3">
            <h2 className="text-xl font-semibold">Let&apos;s get you started</h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Fresh install — nothing to see yet. Either load a small demo dataset to
              explore the tool first, or jump straight in and create your first application.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              {isAdmin && (
                <button
                  onClick={loadDemo}
                  className="btn-secondary"
                  disabled={loadingDemo}
                >
                  {loadingDemo ? 'Loading…' : 'Load demo data'}
                </button>
              )}
              <Link href="/applications" className="btn-primary">
                + Create your first application
              </Link>
              <Link href="/projects/new" className="btn-ghost">
                or start a standalone project
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="My open tasks" value={openCount} />
        <StatCard
          label="Due this week"
          value={buckets.today.length + buckets.week.length}
          tone="warn"
        />
        <StatCard
          label="Overdue"
          value={summary?.overdue ?? 0}
          tone={summary?.overdue ? 'bad' : 'default'}
        />
        <StatCard
          label="Completion rate"
          value={`${summary?.completionRate ?? 0}%`}
          sub={`${summary?.completed ?? 0}/${summary?.totalAssigned ?? 0}`}
          tone="good"
        />
      </div>

      <Section
        title="Today"
        hint="Due today or overdue"
        emphasis
        count={buckets.today.length}
        tasks={buckets.today}
        onToggled={onToggled}
      />
      <Section
        title="This week"
        count={buckets.week.length}
        tasks={buckets.week}
        onToggled={onToggled}
      />
      <Section
        title="Later"
        count={buckets.later.length}
        tasks={buckets.later}
        onToggled={onToggled}
      />
      {buckets.undated.length > 0 && (
        <Section
          title="No due date"
          hint="Consider giving these one so they don't drift."
          count={buckets.undated.length}
          tasks={buckets.undated}
          onToggled={onToggled}
        />
      )}

      {data.subtasks?.length > 0 && (
        <Card title={`My micro-tasks (${data.subtasks.length})`}>
          <div className="divide-y divide-slate-100">
            {data.subtasks.map((s) => (
              <div key={s.id} className="py-2 flex items-center gap-4 text-sm">
                <input type="checkbox" checked={s.status === 'done'} readOnly className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className={s.status === 'done' ? 'line-through text-slate-400' : ''}>
                    {s.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.projectCode} · {s.taskTitle}
                  </div>
                </div>
                <StatusTag status={s.status} />
                <div className="text-xs w-24 text-right text-slate-500">{formatDate(s.dueDate)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {openCount === 0 && !isFreshInstall && (
        <Card>
          <EmptyState
            title="Inbox zero 🏖️"
            hint="Nothing assigned to you right now. Go help someone else, or take a break — you've earned it."
          />
        </Card>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  emphasis,
  count,
  tasks,
  onToggled
}: {
  title: string;
  hint?: string;
  emphasis?: boolean;
  count: number;
  tasks: any[];
  onToggled: (wasDone: boolean) => void;
}) {
  if (count === 0) return null;
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {emphasis && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />}
          <span>{title}</span>
          <span className="text-xs font-normal text-slate-500">({count})</span>
        </span>
      }
      action={hint && <span className="text-xs text-slate-500">{hint}</span>}
    >
      <div className="divide-y divide-slate-100">
        {tasks.map((t) => (
          <TaskRow key={t.id} t={t} onToggled={onToggled} />
        ))}
      </div>
    </Card>
  );
}
