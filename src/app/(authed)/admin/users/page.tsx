'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client/api';
import { Avatar, Card, EmptyState } from '@/components/ui';
import { useToasts } from '@/components/Toasts';

interface U {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'manager' | 'admin';
  title?: string;
  reportsToId?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    title: '',
    role: 'member' as 'member' | 'manager' | 'admin'
  });
  const toasts = useToasts();

  async function load() {
    const [u, meUser] = await Promise.all([api<U[]>('/users'), api<any>('/auth/me')]);
    setUsers(u);
    setMe(meUser.user);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, patch: Partial<U>) {
    await api(`/users/${id}`, { method: 'PATCH', body: patch });
    await load();
    toasts.push({ kind: 'success', message: 'User updated' });
  }

  async function create() {
    if (!form.email || !form.name || !form.password) return;
    try {
      await api('/auth/register', { method: 'POST', body: form });
      toasts.push({ kind: 'success', message: `User ${form.name} created` });
      setForm({ email: '', name: '', password: '', title: '', role: 'member' });
      setCreating(false);
      await load();
    } catch (e: any) {
      toasts.push({ kind: 'error', message: e.message });
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!me || me.role !== 'admin') {
    return (
      <Card>
        <EmptyState title="Admin only" hint="Ask an admin to grant you access." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users &amp; reporting lines</h1>
          <p className="text-sm text-slate-500">
            Add people, set their role, and define who reports to whom.
            The &ldquo;reports to&rdquo; field drives the{' '}
            <span className="font-medium">My Reportings</span> page.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setCreating((v) => !v)}
          disabled={creating}
        >
          + Add user
        </button>
      </div>

      {creating && (
        <Card title="Add user">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="input md:col-span-1"
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            <input
              className="input md:col-span-2"
              placeholder="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Initial password (>= 6 chars) *"
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <select
              className="select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <input
              className="input md:col-span-5"
              placeholder="Title (optional) — e.g. QA Analyst, DGM · LIMS"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={create}>
              Create
            </button>
            <button className="btn-ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left font-semibold py-2">User</th>
              <th className="text-left font-semibold py-2">Title</th>
              <th className="text-left font-semibold py-2">Role</th>
              <th className="text-left font-semibold py-2">Reports to</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={user.name} />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2">
                  <input
                    className="input text-sm"
                    defaultValue={user.title || ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (user.title || '')) update(user.id, { title: v });
                    }}
                  />
                </td>
                <td className="py-2">
                  <select
                    className="select text-sm"
                    value={user.role}
                    onChange={(e) =>
                      update(user.id, { role: e.target.value as U['role'] })
                    }
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-2">
                  <select
                    className="select text-sm"
                    value={user.reportsToId || ''}
                    onChange={(e) =>
                      update(user.id, {
                        reportsToId: e.target.value || null
                      } as any)
                    }
                  >
                    <option value="">— None —</option>
                    {users
                      .filter((u) => u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                          {u.title ? ` · ${u.title}` : ''}
                        </option>
                      ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
