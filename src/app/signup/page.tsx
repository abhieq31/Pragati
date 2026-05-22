'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

function StrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'A–Z',      ok: /[A-Z]/.test(password) },
    { label: 'a–z',      ok: /[a-z]/.test(password) },
    { label: '0–9',      ok: /[0-9]/.test(password) },
    { label: '#!@',      ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = score <= 2 ? '#EF4444' : score <= 3 ? '#F59E0B' : '#43A047';
  const labels = ['', 'Very weak', 'Weak', 'Okay', 'Strong', 'Excellent'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 flex-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-1 flex-1 rounded-sm transition-all"
              style={{ background: i <= score ? barColor : '#e2e8f0' }} />
          ))}
        </div>
        <span className="text-[11px] font-bold" style={{ color: barColor }}>{labels[score]}</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className={`text-[10px] ${c.ok ? 'text-green-600 font-semibold' : 'text-slate-300'}`}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get('token') || '';

  const [phase,     setPhase]     = useState<'validating' | 'invalid' | 'ready' | 'submitting' | 'done'>('validating');
  const [reason,    setReason]    = useState<string>('');
  const [email,     setEmail]     = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [name,      setName]      = useState('');
  const [title,     setTitle]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [err,       setErr]       = useState('');

  useEffect(() => {
    if (!token) { setPhase('invalid'); setReason('missing_token'); return; }
    api(`/invites/validate?token=${encodeURIComponent(token)}`)
      .then((d: any) => {
        if (!d.valid) { setPhase('invalid'); setReason(d.reason); return; }
        setEmail(d.email);
        setInvitedBy(d.invitedByName || '');
        setPhase('ready');
      })
      .catch(() => { setPhase('invalid'); setReason('error'); });
  }, [token]);

  const strong  = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const matches = password === confirm && password.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!name.trim() || !strong || !matches) return;
    setPhase('submitting');
    try {
      await api('/auth/signup', { method: 'POST', body: { token, name: name.trim(), password, title: title.trim() } });
      setPhase('done');
      setTimeout(() => router.replace('/'), 600);
    } catch (e: any) {
      setErr(e.message || 'Sign-up failed.');
      setPhase('ready');
    }
  }

  if (phase === 'validating') {
    return (
      <div className="text-center py-10">
        <div className="w-8 h-8 mx-auto border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 mt-3">Verifying your invite…</p>
      </div>
    );
  }

  if (phase === 'invalid') {
    const message =
      reason === 'expired'    ? 'This invite has expired. Ask your lead to send a new one.'
    : reason === 'consumed'   ? 'This invite has already been used.'
    : reason === 'revoked'    ? 'This invite was revoked by the lead who created it.'
    : reason === 'not_found'  ? "We couldn't find this invite. Check the link and try again."
    : reason === 'missing_token' ? 'No invite token was provided in the link.'
                                 : 'This invite link is not valid.';
    return (
      <div className="text-center py-8">
        <AlertTriangle size={28} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Invite unavailable</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">{message}</p>
        <Link href="/login" className="inline-block mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700">
          Back to sign in →
        </Link>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="text-center py-10">
        <CheckCircle2 size={36} className="mx-auto text-green-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Welcome aboard</h2>
        <p className="text-sm text-slate-500 mt-1">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-slate-600">
        Invited by <span className="font-semibold text-slate-800">{invitedBy || 'a team lead'}</span> · You're signing up as <span className="font-semibold text-slate-800">{email}</span>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required autoFocus />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Designation <span className="font-normal lowercase text-slate-300">(optional)</span></label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team Lead — QA-IT" />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
        <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, mixed case + number + symbol" autoComplete="new-password" required />
        <StrengthMeter password={password} />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm password</label>
        <input
          type="password"
          className={`input ${confirm && !matches ? 'border-red-300 focus:border-red-400' : ''}`}
          value={confirm} onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" required
        />
        {confirm && !matches && <p className="text-[11px] text-red-500 mt-1">Passwords don't match.</p>}
      </div>

      {err && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
      )}

      <button
        type="submit"
        className="btn-primary w-full justify-center"
        disabled={!name.trim() || !strong || !matches || phase === 'submitting'}
      >
        {phase === 'submitting' ? 'Creating account…' : 'Create my account'}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Already have an account? <Link href="/login" className="text-blue-600 font-semibold">Sign in</Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-stretch bg-slate-50">
      {/* Left hero — same vibe as /login */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white"
        style={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)' }}>
        <div className="flex items-center gap-3">
          <Image src="/pragati-logo.png" alt="Pragati" width={40} height={40} className="rounded" />
          <div>
            <div className="text-lg font-black tracking-tight">Pragati</div>
            <div className="text-[11px] uppercase tracking-widest opacity-70">Project Intelligence</div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black leading-tight tracking-tight">Set up your lead account.</h1>
          <p className="mt-3 text-sm opacity-80 max-w-md">
            One-time invite, single-use. Once you finish here, you'll land directly on your dashboard.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs opacity-70">
            <ShieldCheck size={14} /> Audit trail recorded for 21 CFR Part 11 §11.10(d).
          </div>
        </div>
        <div className="text-[11px] opacity-50">© Alembic Pharmaceuticals · QA-IT</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-center py-10 text-sm text-slate-400">Loading…</div>}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
