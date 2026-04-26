'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (e: any) {
      // Only surfaces in dev when SMTP is misconfigured
      setErr(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="Alembic Digital" style={{ width: 180 }} />
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly. Check your spam folder too.
            </p>
            <Link href="/login" className="block text-sm text-blue-700 font-semibold hover:underline mt-4">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Forgot password?</h2>
            <p className="text-sm text-slate-500 mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@alembic.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {err && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60 transition-opacity"
                style={{ background: '#1565C0' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Remembered it?{' '}
              <Link href="/login" className="text-blue-700 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
