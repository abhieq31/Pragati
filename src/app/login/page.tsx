'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const FEATURES = [
  { text: 'One place for every deviation, CAPA, and audit finding', accent: false },
  { text: 'Real-time project health across all teams and sites',     accent: false },
  { text: 'GxP-compliant audit trail, built in from day one',       accent: true  },
  { text: 'Integrates with MES, LIMS, TrackWise, Documentum',       accent: false },
];

function StrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'A–Z',      ok: /[A-Z]/.test(password) },
    { label: 'a–z',      ok: /[a-z]/.test(password) },
    { label: '0–9',      ok: /[0-9]/.test(password) },
    { label: '#!@',      ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = score <= 2 ? '#EF4444' : score <= 3 ? '#F59E0B' : '#22C55E';
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-sm transition-all duration-300"
            style={{ background: i <= score ? barColor : '#E2E8F0' }} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: 10 }} className={`transition-colors ${c.ok ? 'text-green-600 font-medium' : 'text-slate-300'}`}>
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
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.80; transform: scale(1.06); }
        }
        @keyframes logo-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .logo-float { animation: logo-float 5s ease-in-out infinite; }
        .fade-up    { animation: fade-up 0.6s ease-out forwards; }
        .fade-up-1  { animation: fade-up 0.6s 0.1s ease-out both; }
        .fade-up-2  { animation: fade-up 0.6s 0.2s ease-out both; }
        .fade-up-3  { animation: fade-up 0.6s 0.3s ease-out both; }
      `}</style>

      <div className="min-h-screen flex">

        {/* ════════════════════════════════════════════════════════════════
            LEFT — Brand immersion panel
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-[54%] flex-col relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #050E1D 0%, #091828 40%, #0B1F3A 70%, #0C2347 100%)',
          }}
        >
          {/* ── Background texture: fine dot grid ── */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          {/* ── Atmospheric glow blobs ── */}
          <div className="absolute pointer-events-none" style={{
            top: '18%', left: '50%', transform: 'translateX(-50%)',
            width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(21,101,192,0.22) 0%, transparent 65%)',
            animation: 'glow-pulse 6s ease-in-out infinite',
          }} />
          <div className="absolute pointer-events-none" style={{
            bottom: '-10%', right: '-10%',
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(43,140,41,0.12) 0%, transparent 70%)',
          }} />
          <div className="absolute pointer-events-none" style={{
            top: '-8%', left: '-8%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(21,101,192,0.10) 0%, transparent 70%)',
          }} />

          {/* ── Content wrapper ── */}
          <div className="relative flex flex-col flex-1 px-14 py-12">

            {/* HERO: Logo card — floating, centered, large */}
            <div className="flex-1 flex flex-col justify-center">

              {/* Floating logo card — the centerpiece */}
              <div className="flex justify-center mb-10 logo-float">
                <div style={{
                  background: '#ffffff',
                  borderRadius: 20,
                  padding: '22px 40px',
                  boxShadow: `
                    0 0 0 1px rgba(255,255,255,0.08),
                    0 24px 64px rgba(0,0,0,0.5),
                    0 8px 24px rgba(21,101,192,0.25),
                    inset 0 1px 0 rgba(255,255,255,0.9)
                  `,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-full.png"
                    alt="Alembic Digital"
                    style={{ height: 52, width: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* Label */}
              <div className="fade-up-1 text-center" style={{ fontSize: 10, letterSpacing: '0.22em' }}>
                <span className="text-blue-400/60 uppercase font-bold">Quality Informatics Platform</span>
              </div>

              {/* Hero wordmark */}
              <h1
                className="fade-up-2 text-center font-black text-white mt-3 leading-none"
                style={{ fontSize: 'clamp(58px, 5.8vw, 80px)', letterSpacing: '-0.035em' }}
              >
                Pragati.
              </h1>

              {/* Divider */}
              <div className="fade-up-2 flex justify-center mt-5">
                <div className="h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #1769C8, #43A047)' }} />
              </div>

              {/* Tagline */}
              <p className="fade-up-3 text-center text-white/40 mt-4 leading-relaxed mx-auto max-w-xs" style={{ fontSize: 14 }}>
                Built for pharma QA teams who need more than a spreadsheet.
              </p>

              {/* Features */}
              <ul className="fade-up-3 mt-9 space-y-3 max-w-xs mx-auto w-full">
                {FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3">
                    <CheckCircle2
                      size={15}
                      className="shrink-0 mt-0.5"
                      style={{ color: f.accent ? '#43A047' : 'rgba(96,165,250,0.7)' }}
                    />
                    <span style={{ fontSize: 13, color: f.accent ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.42)' }}
                      className="leading-snug">
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

            </div>

            {/* Bottom footer */}
            <div className="text-center pb-2">
              <div style={{ fontSize: 11, fontStyle: 'italic' }} className="text-white/18 tracking-wide">
                Empowering Excellence through Technology
              </div>
              <div style={{ fontSize: 10 }} className="text-white/10 uppercase tracking-[0.18em] mt-1.5">
                Alembic Limited · Est. 1907 · Vadodara
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT — Pure form panel
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12 relative">

          {/* Top gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #1565C0 0%, #1769C8 50%, #2B8C29 100%)' }} />

          <div className="w-full max-w-[340px] fade-up">

            {/* Mobile-only branding (hidden on desktop where left panel is visible) */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <div style={{ background: '#0B1628', borderRadius: 12, padding: '8px 16px', display: 'inline-flex', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.png" alt="" width={24} height={24} style={{ display: 'block', objectFit: 'contain' }} />
              </div>
              <div className="text-xl font-black text-slate-900 mt-2 tracking-tight">Pragati</div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-slate-400 mt-1 leading-snug">
                {mode === 'login'
                  ? 'Sign in to your Pragati workspace.'
                  : 'Join your team on Pragati today.'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full name</label>
                    <input className="input" placeholder="Your name" required
                      value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Job title <span className="normal-case font-normal text-slate-300">(optional)</span>
                    </label>
                    <input className="input" placeholder="e.g. Validation Engineer"
                      value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input className="input" type="email" placeholder="you@alembic.com" required
                  autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {mode === 'login' && (
                    <a href="/forgot-password" className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <input className="input" type="password" required minLength={mode === 'register' ? 8 : 1}
                  placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                {mode === 'register' && <StrengthMeter password={password} />}
              </div>

              {err && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-snug">
                  {err}
                </div>
              )}

              {/* CTA button */}
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 group mt-1"
                style={{ background: 'linear-gradient(135deg, #1256B0 0%, #1769C8 100%)', boxShadow: '0 4px 14px rgba(21,101,192,0.35)' }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait…
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode toggle */}
            <p className="mt-5 text-center text-sm text-slate-400">
              {mode === 'login' ? (
                <>
                  New to Pragati?{' '}
                  <button onClick={() => { setMode('register'); setErr(''); }}
                    className="text-blue-600 font-semibold hover:underline">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button onClick={() => { setMode('login'); setErr(''); }}
                    className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>

            {/* Footer trust line */}
            <div className="mt-12 pt-6 border-t border-slate-100 text-center">
              <div style={{ fontSize: 11 }} className="text-slate-300">
                Pragati · Quality Informatics · Alembic Digital
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
