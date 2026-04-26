'use client';
import { useState } from 'react';
import { api } from '@/lib/client/api';
import { Card } from '@/components/ui';

function StrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',        ok: password.length >= 8 },
    { label: 'Uppercase letter',      ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter',      ok: /[a-z]/.test(password) },
    { label: 'Number',                ok: /[0-9]/.test(password) },
    { label: 'Special character',     ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-forest-500'];
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? colors[score - 1] : 'bg-slate-200'}`}
          />
        ))}
        <span className={`text-xs ml-2 font-semibold ${score >= 4 ? 'text-forest-600' : score >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
          {labels[score - 1] || ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-forest-600' : 'text-slate-400'}`}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr]         = useState('');

  const checks = {
    length:    next.length >= 8,
    upper:     /[A-Z]/.test(next),
    lower:     /[a-z]/.test(next),
    number:    /[0-9]/.test(next),
    special:   /[^A-Za-z0-9]/.test(next),
  };
  const strong = Object.values(checks).every(Boolean);
  const matches = next === confirm && next.length > 0;
  const canSave = current.length > 0 && strong && matches;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSuccess(false);
    if (!canSave) return;
    setSaving(true);
    try {
      await api('/auth/password', { method: 'PATCH', body: { currentPassword: current, newPassword: next } });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) {
      setErr(e.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update your password here.</p>
      </div>

      <Card title="Change password">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              placeholder="Your current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>

          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              placeholder="At least 8 characters"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <StrengthMeter password={next} />
          </div>

          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className={`input ${confirm && !matches ? 'border-red-300 focus:ring-red-200' : ''}`}
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm && !matches && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match.</p>
            )}
          </div>

          {err && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          {success && (
            <div className="text-sm text-forest-700 bg-forest-50 border border-forest-200 rounded-lg px-3 py-2">
              Password updated successfully.
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!canSave || saving}
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </Card>
    </div>
  );
}
