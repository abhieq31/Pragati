'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';

// Alembic Digital chevron mark (replicates the logo arrows)
function ChevronMark({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.88)} viewBox="0 0 52 46" fill="none">
      <path d="M3 4 L19 23 L3 42"   stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4 L32 23 L16 42" stroke="rgba(255,255,255,0.85)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M29 13 L45 23 L29 33" stroke="#66BB6A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlembicWordmark() {
  return (
    <div className="flex items-center gap-4">
      <ChevronMark size={44} />
      <div>
        <div className="text-white font-black text-3xl tracking-tight leading-none">
          Alembic <span className="text-blue-200">Digital</span>
        </div>
        <div className="text-forest-300 text-xs font-semibold tracking-widest uppercase mt-1">
          Quality Informatics
        </div>
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
      setErr(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0A3480 0%, #0D47A1 40%, #1565C0 75%, #1E88E5 100%)' }}
    >
      {/* Decorative background chevrons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute -right-20 top-10 opacity-5" width="500" height="400" viewBox="0 0 500 400" fill="none">
          <path d="M50 20 L200 200 L50 380"  stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M180 20 L330 200 L180 380" stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M300 80 L420 200 L300 320" stroke="#43A047" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg className="absolute -left-32 bottom-10 opacity-5" width="400" height="320" viewBox="0 0 400 320" fill="none">
          <path d="M40 16 L160 160 L40 304"  stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M144 16 L264 160 L144 304" stroke="#43A047" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="w-full max-w-5xl relative">
        {/* Top tagline bar */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-wide">
              Empowering Excellence through Technology
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-5 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/15 overflow-hidden shadow-2xl">

          {/* ── Left branded panel (3/5 columns) ── */}
          <div className="md:col-span-3 p-10 flex flex-col justify-between relative">
            {/* Subtle inner gradient overlay */}
            <div className="absolute inset-0 opacity-20" style={{
              background: 'radial-gradient(ellipse at top right, rgba(66,185,245,0.3) 0%, transparent 70%)'
            }} />

            <div className="relative">
              {/* Alembic Digital wordmark */}
              <AlembicWordmark />

              <div className="mt-8 space-y-1">
                <h1 className="text-3xl font-black text-white leading-tight">
                  Track your work.<br />
                  <span className="text-blue-200">Celebrate what you build.</span>
                </h1>
                <p className="text-blue-100/70 text-sm leading-relaxed mt-3">
                  A project management tool built for the QI team — from first requirement
                  to PRD deployment across MES, LIMS, TRACKWISE, DOCUMENTUM and IDP Logbook.
                </p>
              </div>

              {/* Feature bullets */}
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: '✓',
                    color: 'bg-forest-500/20 text-forest-300',
                    title: 'Your tasks, your ownership',
                    desc: 'See everything in your bucket. Add tasks in seconds. Mark done and feel great.'
                  },
                  {
                    icon: '◈',
                    color: 'bg-blue-400/20 text-blue-300',
                    title: 'Macro + Micro visibility',
                    desc: 'Project-level progress rolls up from every subtask. Nothing falls through the cracks.'
                  },
                  {
                    icon: '🏆',
                    color: 'bg-amber-400/20 text-amber-300',
                    title: 'Yearly achievements',
                    desc: 'Your big deliveries and early completions — recognised and celebrated.'
                  },
                  {
                    icon: '◈',
                    color: 'bg-forest-500/20 text-forest-300',
                    title: 'PM big picture',
                    desc: 'Satya sees the whole team\'s progress. No spreadsheets.'
                  }
                ].map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5`}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{f.title}</div>
                      <div className="text-blue-100/55 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom decorative line */}
            <div className="relative mt-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-forest-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                </div>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              </div>
              <p className="text-center text-[10px] text-blue-200/30 mt-2 uppercase tracking-widest">
                Open source · Self-hosted · No external AI APIs
              </p>
            </div>
          </div>

          {/* ── Right form panel (2/5 columns) ── */}
          <div className="md:col-span-2 bg-white rounded-none md:rounded-r-3xl p-8 flex flex-col justify-center">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-brand-800">
                {mode === 'login' ? 'Welcome back' : 'Join the team'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'login' ? 'Sign in to see your tasks' : 'Create your account to get started'}
              </p>
              {/* Alembic blue underline accent */}
              <div className="mt-3 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #1565C0, #43A047)' }} />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="label">Full name</label>
                    <input className="input" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Role / Title</label>
                    <input className="input" placeholder="e.g. UI/UX Designer, Developer" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@alembic.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {err && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              <button
                className="w-full justify-center py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 shadow-brand"
                style={{ background: loading ? '#1565C0' : 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait…
                  </span>
                ) : (
                  mode === 'login' ? 'Sign in →' : 'Create account →'
                )}
              </button>
            </form>

            <p className="mt-5 text-sm text-center text-slate-500">
              {mode === 'login' ? (
                <>
                  New to QInformX?{' '}
                  <button className="text-brand-600 font-semibold hover:underline" onClick={() => setMode('register')}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button className="text-brand-600 font-semibold hover:underline" onClick={() => setMode('login')}>
                    Sign in
                  </button>
                </>
              )}
            </p>

            {mode === 'register' && (
              <p className="mt-3 text-xs text-center text-slate-400 leading-relaxed">
                First person to register becomes the <strong>Project Manager</strong>.
              </p>
            )}

            {/* Bottom Alembic tagline */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <div className="flex items-center justify-center gap-2">
                <svg width="18" height="16" viewBox="0 0 36 32" fill="none">
                  <path d="M2 3 L13 16 L2 29"   stroke="#1E88E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 3 L22 16 L11 29" stroke="#1565C0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 9 L30 16 L20 23" stroke="#43A047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Alembic · Touching Lives over 100 Years
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
