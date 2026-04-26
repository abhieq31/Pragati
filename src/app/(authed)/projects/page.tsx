'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import {
  Card,
  LifecycleTag,
  ProgressBar,
  StatusTag,
  formatDate
} from '@/components/ui';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [lifecycles, setLifecycles] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [team, setTeam] = useState('');
  const [lc, setLc] = useState('');
  const [status, setStatus] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (team) params.set('teamId', team);
    if (lc) params.set('lifecycle', lc);
    if (status) params.set('status', status);
    api<any[]>(`/projects?${params.toString()}`).then(setProjects);
  }

  useEffect(() => {
    api<any[]>('/teams').then(setTeams);
    api<any[]>('/lifecycles').then(setLifecycles);
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 150);
    return () => clearTimeout(id);
  }, [q, team, lc, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-slate-500">
            Macro view of all quality projects across teams &amp; lifecycles.
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          + New project
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="input"
            placeholder="Search projects…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="select" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select className="select" value={lc} onChange={(e) => setLc(e.target.value)}>
            <option value="">All lifecycles</option>
            {lifecycles.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In progress</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {projects.map((p) => {
          const pct = p.taskCount ? Math.round((p.tasksDone / p.taskCount) * 100) : 0;
          const overdueRatio = p.taskCount ? (p.tasksOverdue || 0) / p.taskCount : 0;
          const healthColor = overdueRatio > 0.3 ? '#ef4444' : overdueRatio > 0 ? '#f59e0b' : '#22c55e';
          return (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="card p-4 hover:shadow-md transition-shadow group block"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">{p.code}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: healthColor }} title={overdueRatio > 0.3 ? 'Critical' : overdueRatio > 0 ? 'At risk' : 'Healthy'} />
                  </div>
                  <div className="font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{p.name}</div>
                  {p.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <LifecycleTag lifecycle={p.lifecycle} />
                  <StatusTag status={p.status} />
                </div>
              </div>
              <ProgressBar value={pct} />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{p.tasksDone}/{p.taskCount} tasks</span>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{p.teamName || '—'}</span>
                  <span>{formatDate(p.dueDate)}</span>
                  <span className={`font-semibold ${pct >= 90 ? 'text-green-600' : 'text-slate-500'}`}>{pct}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {projects.length === 0 && (
        <Card>
          <div className="py-10 text-center text-slate-500">
            No projects match those filters.{' '}
            <Link href="/projects/new" className="text-brand-700 hover:underline">
              Create one?
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
