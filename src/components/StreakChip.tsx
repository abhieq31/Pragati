'use client';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { api } from '@/lib/client/api';

/**
 * Streak chip — Outliers' lesson made visible: mastery is accumulated
 * advantage, and the engine of it is showing up. A streak buried on the
 * profile page can't drive a habit; one rendered on the dashboard, every day,
 * at the moment of work, can. "Don't break the chain."
 *
 * Self-contained and additive: reads the stats endpoint that already computes
 * the streak, renders nothing until it knows, and stays silent at zero (a "0"
 * badge would shame, not motivate — the chain appears once it exists). When
 * today still has no completion, it nudges to protect the run.
 */
export function StreakChip() {
  const [s, setS] = useState<{ streak: number; doneToday: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<{ streak: number; doneToday: number }>('/users/me/stats')
        .then((d) => alive && setS({ streak: d.streak ?? 0, doneToday: d.doneToday ?? 0 }))
        .catch(() => {});
    load();
    // Completing a task (anywhere in the app) fires this — refresh so the chain
    // lights up the moment today's first task lands, without a reload.
    window.addEventListener('pragati:data-changed', load);
    return () => {
      alive = false;
      window.removeEventListener('pragati:data-changed', load);
    };
  }, []);

  if (!s || s.streak < 1) return null;

  // The chain is intact through today only once something is done today; until
  // then it's "alive but unprotected", so the copy gently points at it.
  const atRisk = s.doneToday === 0;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold shrink-0 transition-colors ${
        atRisk
          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
      }`}
      title={
        atRisk
          ? `${s.streak}-day streak — close one task today to keep it alive.`
          : `${s.streak}-day streak. Don't break the chain.`
      }
    >
      <Flame size={13} className={atRisk ? '' : 'fill-current'} />
      <span className="tabular-nums">{s.streak}</span>
      <span className="font-semibold opacity-80">day{s.streak === 1 ? '' : 's'}</span>
    </div>
  );
}
