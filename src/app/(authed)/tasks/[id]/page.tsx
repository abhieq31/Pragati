'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/client/api';
import {
  Card,
  PriorityTag,
  StatusTag,
  formatDate,
  Avatar
} from '@/components/ui';

const STATUSES = ['todo', 'in_progress', 'review', 'blocked', 'done'] as const;

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [newSub, setNewSub] = useState('');

  async function load() {
    setTask(await api<any>(`/tasks/${id}`));
  }
  useEffect(() => {
    load();
    api<any[]>('/users').then(setUsers);
    api<any>('/auth/me').then((d) => setMe(d.user));
  }, [id]);

  if (!task) return <div className="text-slate-500">Loading…</div>;

  async function update(patch: any) {
    await api(`/tasks/${id}`, { method: 'PATCH', body: patch });
    load();
  }
  async function addSubtask() {
    if (!newSub.trim()) return;
    await api(`/tasks/${id}/subtasks`, { method: 'POST', body: { title: newSub.trim() } });
    setNewSub('');
    load();
  }
  async function toggleSub(sub: any) {
    await api(`/tasks/${id}/subtasks/${sub.id}`, {
      method: 'PATCH',
      body: { status: sub.status === 'done' ? 'todo' : 'done' }
    });
    load();
  }
  async function addComment() {
    if (!comment.trim()) return;
    await api(`/tasks/${id}/comments`, { method: 'POST', body: { body: comment.trim() } });
    setComment('');
    load();
  }
  async function signoff() {
    await api(`/tasks/${id}/signoff`, { method: 'POST' });
    load();
  }
  const canSignoff =
    task.requiresQaSignoff &&
    !task.qaSignoffAt &&
    me?.role === 'pm';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="text-xs text-slate-500">
            <Link
              href={`/projects/${task.projectId}`}
              className="hover:underline"
            >
              {task.projectCode} · {task.projectName}
            </Link>
          </div>
          <h1 className="text-2xl font-bold mt-1">{task.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusTag status={task.status} />
            <PriorityTag priority={task.priority} />
            {task.gxpCritical && (
              <span className="tag bg-red-50 text-red-700 border border-red-200">GxP critical</span>
            )}
            {task.requiresQaSignoff &&
              (task.qaSignoffAt ? (
                <span className="tag bg-emerald-50 text-emerald-700 border border-emerald-200">
                  QA ✓ {task.qaSignoffName} · {formatDate(task.qaSignoffAt)}
                </span>
              ) : (
                <span className="tag bg-purple-50 text-purple-700 border border-purple-200">
                  QA sign-off required
                </span>
              ))}
            <span className="tag bg-slate-100">{task.taskType}</span>
          </div>
        </div>

        <Card title="Description">
          <textarea
            className="textarea min-h-[100px]"
            value={task.description || ''}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            onBlur={(e) => update({ description: e.target.value })}
            placeholder="Describe what's expected, references, evidence…"
          />
        </Card>

        <Card
          title={`Subtasks (${task.subtasks.length})`}
          action={
            <span className="text-xs text-slate-500">
              {task.subtasks.filter((s: any) => s.status === 'done').length}/
              {task.subtasks.length} done
            </span>
          }
        >
          <div className="space-y-1">
            {task.subtasks.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 text-sm py-1">
                <input type="checkbox" checked={s.status === 'done'} onChange={() => toggleSub(s)} />
                <span
                  className={`flex-1 ${
                    s.status === 'done' ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {s.title}
                </span>
                <span className="text-xs text-slate-500">{formatDate(s.dueDate)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              className="input"
              placeholder="Add a subtask…"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            />
            <button className="btn-primary" onClick={addSubtask}>
              Add
            </button>
          </div>
        </Card>

        <Card title={`Comments (${task.comments.length})`}>
          <div className="space-y-3 mb-3">
            {task.comments.map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <Avatar name={c.userName} />
                <div className="flex-1">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{c.userName}</span> ·{' '}
                    {formatDate(c.createdAt)}
                  </div>
                  <div className="text-sm">{c.body}</div>
                </div>
              </div>
            ))}
            {task.comments.length === 0 && (
              <div className="text-sm text-slate-500">No comments yet.</div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <button className="btn-primary" onClick={addComment}>
              Post
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Properties">
          <div className="space-y-3 text-sm">
            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={task.status}
                onChange={(e) => update({ status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select
                className="select"
                value={task.assigneeId || ''}
                onChange={(e) =>
                  update({ assigneeId: e.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Priority</label>
                <select
                  className="select"
                  value={task.priority}
                  onChange={(e) => update({ priority: e.target.value })}
                >
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="select"
                  value={task.taskType}
                  onChange={(e) => update({ taskType: e.target.value })}
                >
                  {[
                    'task',
                    'review',
                    'approval',
                    'test',
                    'deviation',
                    'capa',
                    'audit_finding',
                    'data_review'
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Start</label>
                <input
                  type="date"
                  className="input"
                  value={task.startDate?.slice(0, 10) || ''}
                  onChange={(e) => update({ startDate: e.target.value || null })}
                />
              </div>
              <div>
                <label className="label">Due</label>
                <input
                  type="date"
                  className="input"
                  value={task.dueDate?.slice(0, 10) || ''}
                  onChange={(e) => update({ dueDate: e.target.value || null })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Est. hrs</label>
                <input
                  type="number"
                  className="input"
                  value={task.estimatedHours ?? ''}
                  onChange={(e) =>
                    update({
                      estimatedHours: e.target.value === '' ? null : Number(e.target.value)
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Actual hrs</label>
                <input
                  type="number"
                  className="input"
                  value={task.actualHours ?? ''}
                  onChange={(e) =>
                    update({
                      actualHours: e.target.value === '' ? null : Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-4 pt-2 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!task.gxpCritical}
                  onChange={(e) => update({ gxpCritical: e.target.checked })}
                />
                GxP critical
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!task.requiresQaSignoff}
                  onChange={(e) => update({ requiresQaSignoff: e.target.checked })}
                />
                QA sign-off
              </label>
            </div>
          </div>
        </Card>

        {canSignoff && (
          <Card title="QA sign-off">
            <p className="text-sm text-slate-600 mb-3">
              This task requires QA sign-off. As a {me?.role}, you can approve it once the evidence is reviewed.
            </p>
            <button className="btn-primary w-full justify-center" onClick={signoff}>
              Sign off as QA
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
