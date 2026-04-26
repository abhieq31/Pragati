'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { Avatar, Card } from '@/components/ui';

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [saving, setSaving] = useState<string | null>(null);

  function load() {
    api<any[]>('/users').then(setUsers);
  }
  useEffect(() => {
    load();
    api<any>('/auth/me').then((d) => setMe(d.user));
  }, []);

  async function toggleRole(user: any) {
    const newRole = user.role === 'pm' ? 'employee' : 'pm';
    setSaving(user.id);
    try {
      await api(`/users/${user.id}`, { method: 'PATCH', body: { role: newRole } });
      load();
    } finally {
      setSaving(null);
    }
  }

  const pms = users.filter((u) => u.role === 'pm');
  const employees = users.filter((u) => u.role === 'employee');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">People</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage team access and roles. Project Managers see everything — employees see their own work.
        </p>
      </div>

      <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-slate-50 p-4 text-sm text-slate-700">
        <strong className="text-brand-700">How roles work:</strong> Employees see their tasks, projects, and yearly view.
        Project Managers additionally see Teams, Org overview, and the Insights command center.
        You can promote or demote anyone below. You cannot change your own role.
      </div>

      <Card title={`Project Managers (${pms.length})`}>
        {pms.length === 0 ? (
          <div className="py-4 text-sm text-slate-400">No project managers yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pms.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <Avatar name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.title || 'Project Manager'} · {u.email}</div>
                </div>
                <span className="tag bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold">PM</span>
                {me?.id !== u.id && (
                  <button
                    className="btn-ghost text-xs text-slate-500"
                    onClick={() => toggleRole(u)}
                    disabled={saving === u.id}
                  >
                    {saving === u.id ? '…' : 'Make employee'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Team Members (${employees.length})`}>
        {employees.length === 0 ? (
          <div className="py-4 text-sm text-slate-400">No team members yet. Share the app URL so they can register.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {employees.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <Avatar name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.title || 'Team member'} · {u.email}</div>
                </div>
                <span className="tag bg-slate-100 text-slate-600 border border-slate-200 text-xs">Employee</span>
                <button
                  className="btn-ghost text-xs text-brand-700"
                  onClick={() => toggleRole(u)}
                  disabled={saving === u.id}
                >
                  {saving === u.id ? '…' : 'Make PM'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
