'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/client/api';
import { X, Mail, Copy, Check, Trash2, AlertTriangle, Send } from 'lucide-react';

interface InviteRow {
  id: string;
  email: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  revokedAt:  string | null;
  token: string | null;
}

function statusOf(i: InviteRow): { label: string; tone: 'green' | 'slate' | 'amber' | 'red' } {
  if (i.consumedAt) return { label: 'Joined',  tone: 'green' };
  if (i.revokedAt)  return { label: 'Revoked', tone: 'slate' };
  if (new Date(i.expiresAt) < new Date()) return { label: 'Expired', tone: 'amber' };
  return { label: 'Pending', tone: 'amber' };
}

const TONE_CLASS: Record<string, string> = {
  green: 'bg-green-50 text-green-700',
  slate: 'bg-slate-100 text-slate-500',
  amber: 'bg-amber-50 text-amber-700',
  red:   'bg-red-50 text-red-700',
};

export function InviteLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [invites,    setInvites]    = useState<InviteRow[]>([]);
  const [email,      setEmail]      = useState('');
  const [creating,   setCreating]   = useState(false);
  const [err,        setErr]        = useState('');
  const [justCreated, setJustCreated] = useState<InviteRow | null>(null);
  const [copied,     setCopied]     = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(''); setJustCreated(null); setEmail('');
    api('/invites').then((d: any) => setInvites(d.invites || []));
  }, [open]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.trim()) return;
    setCreating(true);
    try {
      const d: any = await api('/invites', { method: 'POST', body: { email: email.trim() } });
      // Refresh list and surface the new invite link
      const list: any = await api('/invites');
      setInvites(list.invites || []);
      const fresh = (list.invites || []).find((r: InviteRow) => r.id === d.id) || null;
      setJustCreated(fresh);
      setEmail('');
    } catch (e: any) {
      setErr(e.message || 'Failed to create invite.');
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    try {
      await api(`/invites/${id}`, { method: 'DELETE' });
      const list: any = await api('/invites');
      setInvites(list.invites || []);
      if (justCreated?.id === id) setJustCreated(null);
    } catch (e: any) {
      setErr(e.message || 'Failed to revoke invite.');
    }
  }

  function linkFor(token: string | null) {
    if (!token) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/signup?token=${token}`;
  }

  async function copyLink(invite: InviteRow) {
    const url = linkFor(invite.token);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(invite.id);
      setTimeout(() => setCopied(c => (c === invite.id ? null : c)), 1500);
    } catch {
      // Clipboard blocked — surface the URL inline (handled by UI)
    }
  }

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[560px] max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invite a lead</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Send a one-time, 7-day link. The new lead sets their own password.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-50">
            <X size={16} />
          </button>
        </div>

        {/* Create form */}
        <div className="px-5 py-4 border-b border-slate-100">
          <form onSubmit={create} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  className="input pl-7"
                  placeholder="name@alembic.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={creating || !email.trim()}>
              {creating ? '…' : <><Send size={12} /> Invite</>}
            </button>
          </form>
          {err && (
            <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <AlertTriangle size={12} /> {err}
            </div>
          )}
          {justCreated && justCreated.token && (
            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Invite ready · share this link</div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={linkFor(justCreated.token)}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md bg-white border border-emerald-200 font-mono text-slate-700 truncate"
                  onFocus={e => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => copyLink(justCreated)}
                  className="btn-secondary text-xs px-2.5 py-1.5"
                >
                  {copied === justCreated.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <p className="text-[11px] text-emerald-600 mt-2">
                One-time link. Expires {new Date(justCreated.expiresAt).toLocaleDateString()}.
              </p>
            </div>
          )}
        </div>

        {/* Existing invites */}
        <div className="px-5 py-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent invites</h3>
          {invites.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No invites yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invites.map(i => {
                const s = statusOf(i);
                const isActive = !i.consumedAt && !i.revokedAt && new Date(i.expiresAt) >= new Date();
                return (
                  <li key={i.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{i.email}</div>
                      <div className="text-[11px] text-slate-400">
                        Invited by {i.invitedByName || '—'} · {new Date(i.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${TONE_CLASS[s.tone]}`}>
                      {s.label}
                    </span>
                    {isActive && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyLink(i)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50"
                          title="Copy invite link"
                        >
                          {copied === i.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => revoke(i.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                          title="Revoke invite"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
