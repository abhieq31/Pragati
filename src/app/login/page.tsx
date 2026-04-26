'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { AlembicLogo } from '@/components/AlembicLogo';

function StrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars',  ok: password.length >= 8 },
    { label: 'A–Z',       ok: /[A-Z]/.test(password) },
    { label: 'a–z',       ok: /[a-z]/.test(password) },
    { label: '0–9',       ok: /[0-9]/.test(password) },
    { label: '#!@',       ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = score <= 2 ? '#EF4444' : score <= 3 ? '#F59E0B' : '#22C55E';
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-sm transition-all duration-200"
            style={{ background: i <= score ? barColor : '#E2E8F0' }}
          />
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: 10 }} className={c.ok ? 'text-green-600' : 'text-slate-400'}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await api('/auth/login', { method: 'POST', body: { email, password } });
      } else {
        await api('/auth/register', { method: 'POST', body: { email, password, name, title } });
      }
      router.replace('/');
      router.refresh();
    } catch (e: any) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1628' }}>

      {/* ── Left: brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden">

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ghost icon watermark — bottom-right corner */}
        <div className="absolute -bottom-16 -right-16 pointer-events-none" style={{ opacity: 0.06 }}>
          <AlembicLogo width={380} />
        </div>

        {/* Top: SVG icon + wordmark text — no white box */}
        <div className="relative flex items-center gap-3">
          <AlembicLogo width={30} />
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-tight">Alembic Digital</div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em' }} className="text-white/30 uppercase mt-0.5">
              Touching Lives over 100 years
            </div>
          </div>
        </div>

        {/* Centre: product headline */}
        <div className="relative">
          <div style={{ fontSize: 11, letterSpacing: '0.2em' }} className="text-blue-400/60 uppercase font-bold mb-4">
            Quality Informatics
          </div>
          <h1
            className="font-black leading-none text-white"
            style={{ fontSize: 'clamp(52px, 6vw, 80px)', letterSpacing: '-0.03em' }}
          >
            Pragati.
          </h1>
          <div className="mt-5 w-10 h-0.5 rounded-full" style={{ background: '#1769C8' }} />
          <p className="mt-5 text-white/40 leading-relaxed max-w-xs" style={{ fontSize: 15 }}>
            One tool for every deviation, CAPA, audit finding, and validation across MES, LIMS, TrackWise, and Documentum.
          </p>

          {/* Stats row */}
          <div className="mt-10 flex gap-8">
            {[
              { n: '100+', label: 'Years of quality' },
              { n: 'GxP',  label: 'Compliant' },
              { n: '∞',    label: 'Accountability' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white font-black" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{s.n}</div>
                <div style={{ fontSize: 11 }} className="text-white/30 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline text — no image, no box */}
        <div className="relative">
          <div style={{ fontSize: 11, fontStyle: 'italic' }} className="text-white/20 tracking-wide">
            Empowering Excellence through Technology
          </div>
          <div style={{ fontSize: 10 }} className="text-white/10 uppercase tracking-widest mt-1">
            Alembic Limited · Est. 1907 · Vadodara
          </div>
        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12">

        {/* Full wordmark — sits naturally on white, perfectly on-brand */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-full.png"
          alt="Alembic Digital"
          className="mb-10 lg:mb-12"
          style={{ width: 200, display: 'block' }}
        />

        <div className="w-full max-w-sm">

          {/* Mode toggle */}
          <div className="flex border-b border-slate-200 mb-8">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); }}
                className="flex-1 pb-3 text-sm font-semibold transition-colors relative"
                style={{ color: mode === m ? '#0D47A1' : '#94a3b8' }}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
                {mode === m && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#1565C0' }} />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full name</label>
                  <input
                    className="input"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job title</label>
                  <input
                    className="input"
                    placeholder="e.g. Validation Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@alembic.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'register' && <StrengthMeter password={password} />}
            </div>

            {err && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-60 mt-2"
              style={{ background: '#1565C0' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait…
                </span>
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            {mode === 'login' ? (
              <>New to Pragati?{' '}
                <button onClick={() => { setMode('register'); setErr(''); }} className="text-blue-700 font-semibold hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setErr(''); }} className="text-blue-700 font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>

        </div>
      </div>

    </div>
  );
}
