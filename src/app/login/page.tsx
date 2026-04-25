'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';

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
      setErr(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-700 to-brand-900 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                QI
              </div>
              <div>
                <div className="font-bold text-lg">QInformX</div>
                <div className="text-xs text-brand-200">Alembic Pharma · Quality Informatics</div>
              </div>
            </div>

            <h1 className="text-3xl font-bold leading-snug">
              Track your work.<br />Celebrate what you build.
            </h1>
            <p className="mt-4 text-brand-100 text-sm leading-relaxed">
              Built for the QI team at Alembic Pharma. Manage projects across MES, LIMS, TRACKWISE,
              DOCUMENTUM and IDP Logbook — from first requirement to PRD deployment.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">✓</div>
                <div>
                  <div className="font-medium text-sm">Your tasks, your way</div>
                  <div className="text-xs text-brand-200">Add tasks in seconds. Mark done and feel great about it.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">📊</div>
                <div>
                  <div className="font-medium text-sm">Big picture for the PM</div>
                  <div className="text-xs text-brand-200">Satya sees the whole team's progress — no spreadsheets.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">🏆</div>
                <div>
                  <div className="font-medium text-sm">Yearly achievements</div>
                  <div className="text-xs text-brand-200">See your big wins and early completions at year end.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-brand-200/60 mt-6">
            Open source · Self-hosted · No external dependencies
          </div>
        </div>

        {/* Right panel — form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-sm">QI</div>
              <div className="font-bold text-slate-800">QInformX</div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Join the team'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' ? 'Sign in to see your tasks' : 'Create your account to get started'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Full name</label>
                  <input
                    className="input"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Role / Title</label>
                  <input
                    className="input"
                    placeholder="e.g. UI/UX Designer, Developer, QA Specialist"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
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
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {err}
              </div>
            )}

            <button className="btn-primary w-full justify-center py-2.5 text-base" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-slate-500">
            {mode === 'login' ? (
              <>
                New to QInformX?{' '}
                <button className="text-brand-700 font-medium hover:underline" onClick={() => setMode('register')}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="text-brand-700 font-medium hover:underline" onClick={() => setMode('login')}>
                  Sign in
                </button>
              </>
            )}
          </p>

          {mode === 'register' && (
            <p className="mt-3 text-xs text-center text-slate-400">
              First person to register becomes the Project Manager.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
