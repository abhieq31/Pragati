'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sunrise,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Users,
  Bell,
  BellRing,
  Ticket,
} from 'lucide-react';
import { api } from '@/lib/client/api';
import { useCurrentUser } from '@/components/CurrentUserContext';
import { QUIP_NAME_KEY } from '@/components/LoadingQuip';

/* ── Web Push opt-in (zero-cost channel; hidden when not configured) ──────── */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function pushSupported(): boolean {
  return !!VAPID_PUBLIC && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Morning Brief card — the in-app renderer of the Daily Brief object
 * (GET /api/me/brief). Three rules keep it from feeling like spam:
 *
 *   1. Silence is a feature — when the brief has no content, nothing renders.
 *   2. One glance — a single headline plus at most a handful of rows, never a
 *      second dashboard.
 *   3. Dismissable per day — the ✕ hides it until tomorrow (localStorage),
 *      so it never nags twice.
 */

interface BriefItem {
  id: string;
  title: string;
  projectName: string | null;
  label: string;
  priority: string | null;
}

interface Brief {
  role: string;
  dateLabel: string;
  headline: string;
  hasContent: boolean;
  my: {
    overdue: BriefItem[];
    today: BriefItem[];
    soon: BriefItem[];
    approvals: number;
    winsYesterday: number;
  };
  team?: {
    blocked: { id: string; title: string; projectName: string | null; days: number }[];
    signoffsPending: number;
    overdueByMember: { name: string; count: number }[];
    tickets?: BriefTickets;
  };
  workspace?: {
    doneYesterday: number;
    overdueTotal: number;
    activeProjects: number;
    risky: { id: string; name: string; overdue: number }[];
    auditHighlights: { summary: string; at: string }[];
    tickets?: BriefTickets;
  };
}

interface BriefTickets {
  totalOpen: number;
  loggedToday: number;
  resolvedToday: number;
  netFlow7: number;
  wow: string;
  headline: string;
  projects: { name: string; open: number; loggedToday: number; resolvedToday: number; wow: string }[];
}

/** Compact support-ticket line for the lead/admin brief. */
function TicketsLine({ t }: { t: BriefTickets }) {
  if (!t || t.projects.length === 0) return null;
  return (
    <div className="mt-2 flex items-start gap-1.5">
      <Ticket size={11} className="mt-[3px] shrink-0 text-blue-500 dark:text-blue-400" />
      <div className="text-[11px] text-slate-500 dark:text-white/40 min-w-0">
        <span className="font-semibold text-slate-700 dark:text-white/70">{t.totalOpen} open</span> · +
        {t.loggedToday}/−{t.resolvedToday} today · <span className="font-medium">{t.wow}</span>
        {t.projects.length > 1 && (
          <span className="text-slate-400 dark:text-white/30">
            {' '}
            ·{' '}
            {t.projects
              .slice(0, 3)
              .map((p) => `${p.name} ${p.open}`)
              .join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}

function dismissKey(): string {
  return `pragati-brief-dismissed:${new Date().toISOString().slice(0, 10)}`;
}

const LABEL_TONE: Record<string, string> = {
  overdue: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
  today: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
  soon: 'text-slate-600 bg-slate-100 dark:text-white/50 dark:bg-white/[0.06]',
};

function TaskRow({ item, tone }: { item: BriefItem; tone: 'overdue' | 'today' | 'soon' }) {
  return (
    <Link href={`/tasks/${item.id}`} className="flex items-center gap-2 py-1 group/row min-w-0">
      <span
        className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${LABEL_TONE[tone]}`}
      >
        {item.label}
      </span>
      <span className="text-[12.5px] text-slate-700 dark:text-white/70 truncate group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400 transition-colors">
        {item.title}
      </span>
      {item.projectName && (
        <span className="text-[10.5px] text-slate-400 dark:text-white/30 truncate shrink-0 max-w-[140px]">
          · {item.projectName}
        </span>
      )}
    </Link>
  );
}

export function DailyBrief() {
  const currentUser = useCurrentUser();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [dismissed, setDismissed] = useState(true); // assume hidden until we know
  // 'hidden' = push not configured/supported here; otherwise off/on/busy.
  const [push, setPush] = useState<'hidden' | 'off' | 'on' | 'busy'>('hidden');

  // Cache the first name so the loading screens can greet by name.
  useEffect(() => {
    const first = (currentUser?.name || '').trim().split(/\s+/)[0];
    if (first) localStorage.setItem(QUIP_NAME_KEY, first);
  }, [currentUser?.name]);

  useEffect(() => {
    setDismissed(!!localStorage.getItem(dismissKey()));
    api<Brief>('/me/brief')
      .then(setBrief)
      .catch(() => {});
    if (pushSupported()) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.pushManager.getSubscription())
        .then((sub) => setPush(sub ? 'on' : 'off'))
        .catch(() => setPush('off'));
    }
  }, []);

  async function togglePush() {
    if (push === 'busy' || push === 'hidden') return;
    setPush('busy');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await api('/push/subscribe', { method: 'DELETE', body: { endpoint: existing.endpoint } });
        await existing.unsubscribe();
        setPush('off');
        return;
      }
      if ((await Notification.requestPermission()) !== 'granted') {
        setPush('off');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      const json = sub.toJSON();
      await api('/push/subscribe', {
        method: 'POST',
        body: { endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
      });
      setPush('on');
    } catch {
      setPush('off');
    }
  }

  if (dismissed || !brief || !brief.hasContent) return null;

  const { my, team, workspace } = brief;
  const personalRows = [
    ...my.overdue.map((t) => ({ t, tone: 'overdue' as const })),
    ...my.today.map((t) => ({ t, tone: 'today' as const })),
    ...my.soon.map((t) => ({ t, tone: 'soon' as const })),
  ].slice(0, 5);

  return (
    <section className="mb-5">
      <div
        className="bg-white dark:bg-[#262624] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
      >
        <div className="px-4 sm:px-5 py-3.5">
          {/* Header — same geometry as the other dashboard section labels. */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Sunrise size={14} className="text-amber-500 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider sm:tracking-[0.14em] text-slate-500 dark:text-white/40 truncate">
                Morning brief
              </h2>
              <span className="text-[10px] text-slate-300 dark:text-white/20 font-semibold shrink-0">
                {brief.dateLabel}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {push !== 'hidden' && (
                <button
                  type="button"
                  onClick={togglePush}
                  disabled={push === 'busy'}
                  aria-label={
                    push === 'on'
                      ? 'Turn off morning notification'
                      : 'Get this brief as a morning notification'
                  }
                  title={
                    push === 'on'
                      ? 'Morning notification on — click to turn off'
                      : 'Get this brief as a morning notification (free, on this device)'
                  }
                  className={`p-1 rounded transition-colors ${
                    push === 'on'
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 hover:text-slate-600 dark:text-white/25 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {push === 'on' ? <BellRing size={13} /> : <Bell size={13} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(dismissKey(), '1');
                  setDismissed(true);
                }}
                aria-label="Dismiss for today"
                title="Dismiss for today"
                className="p-1 rounded text-slate-300 hover:text-slate-600 dark:text-white/25 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* The one sentence that says where to start. */}
          <p className="text-[14px] font-bold text-slate-800 dark:text-white/85 leading-snug">
            {brief.headline}
          </p>

          {/* Personal rows + quiet wins/approvals chips. */}
          {(personalRows.length > 0 || my.approvals > 0 || my.winsYesterday > 0) && (
            <div className="mt-2">
              {personalRows.map(({ t, tone }) => (
                <TaskRow key={t.id} item={t} tone={tone} />
              ))}
              {(my.approvals > 0 || my.winsYesterday > 0) && (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {my.approvals > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                      <ShieldCheck size={12} /> {my.approvals} sign-off
                      {my.approvals === 1 ? '' : 's'} waiting on you
                    </span>
                  )}
                  {my.winsYesterday > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> {my.winsYesterday} closed yesterday
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team pulse — leads only. */}
          {team &&
            (team.blocked.length > 0 ||
              team.signoffsPending > 0 ||
              team.overdueByMember.length > 0 ||
              !!team.tickets) && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={11} className="text-slate-400 dark:text-white/30" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">
                    Team pulse
                  </span>
                </div>
                {team.blocked.map((b) => (
                  <Link
                    key={b.id}
                    href={`/tasks/${b.id}`}
                    className="flex items-center gap-2 py-1 group/row min-w-0"
                  >
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10">
                      {b.days > 0 ? `${b.days}d blocked` : 'Blocked'}
                    </span>
                    <span className="text-[12.5px] text-slate-700 dark:text-white/70 truncate group-hover/row:text-blue-700 dark:group-hover/row:text-blue-400 transition-colors">
                      {b.title}
                    </span>
                    {b.projectName && (
                      <span className="text-[10.5px] text-slate-400 dark:text-white/30 truncate shrink-0 max-w-[140px]">
                        · {b.projectName}
                      </span>
                    )}
                  </Link>
                ))}
                <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-slate-500 dark:text-white/40">
                  {team.signoffsPending > 0 && (
                    <span className="font-semibold">
                      {team.signoffsPending} QA sign-off{team.signoffsPending === 1 ? '' : 's'} pending
                    </span>
                  )}
                  {team.overdueByMember.length > 0 && (
                    <span>
                      Overdue load:{' '}
                      {team.overdueByMember.map((m, i) => (
                        <span key={m.name} className="font-semibold text-slate-600 dark:text-white/55">
                          {i > 0 && ', '}
                          {m.name} ({m.count})
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {team.tickets && <TicketsLine t={team.tickets} />}
              </div>
            )}

          {/* Workspace rundown — admins only. */}
          {workspace && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05]">
              <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 dark:text-white/40">
                <span>
                  <strong className="text-slate-700 dark:text-white/70 tabular-nums">
                    {workspace.doneYesterday}
                  </strong>{' '}
                  closed yesterday
                </span>
                <span>
                  <strong className="text-slate-700 dark:text-white/70 tabular-nums">
                    {workspace.overdueTotal}
                  </strong>{' '}
                  overdue
                </span>
                <span>
                  <strong className="text-slate-700 dark:text-white/70 tabular-nums">
                    {workspace.activeProjects}
                  </strong>{' '}
                  active projects
                </span>
                {workspace.risky.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle size={11} className="text-amber-500" />
                    {workspace.risky.map((p, i) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="font-semibold text-slate-600 dark:text-white/55 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      >
                        {i > 0 && ', '}
                        {p.name} ({p.overdue})
                      </Link>
                    ))}
                  </span>
                )}
              </div>
              {workspace.auditHighlights.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {workspace.auditHighlights.map((a, i) => (
                    <div key={i} className="text-[11px] text-slate-400 dark:text-white/30 truncate">
                      • {a.summary}
                    </div>
                  ))}
                </div>
              )}
              {workspace.tickets && <TicketsLine t={workspace.tickets} />}
            </div>
          )}

          <ChannelsNudge />
        </div>
      </div>
    </section>
  );
}

/* ── Channels nudge ──────────────────────────────────────────────────────────
   One quiet line at the bottom of the brief: "this same rundown can reach you
   by email / live in your calendar". Three rules keep it from being spam:
   shows only the channels the user hasn't set up, disappears on its own once
   both are on, and one ✕ dismisses it forever (localStorage). No modal, no
   badge, no repeat. */
const NUDGE_KEY = 'pragati-channels-nudge-dismissed';

function ChannelsNudge() {
  const [state, setState] = useState<{ email: boolean; calendar: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(NUDGE_KEY)) return; // dismissed forever — skip the fetches too
    setDismissed(false);
    Promise.all([api<any>('/users/me').catch(() => null), api<any>('/me/ics-token').catch(() => null)]).then(
      ([me, ics]) => {
        setState({ email: !!me?.notifDailyDigest, calendar: !!ics?.enabled });
      },
    );
  }, []);

  if (dismissed || !state || (state.email && state.calendar)) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05] flex items-center gap-2 min-w-0">
      <span className="text-[11px] text-slate-400 dark:text-white/35 truncate">
        Get this rundown{' '}
        {!state.email && (
          <Link
            href="/settings#daily-email"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            in your inbox
          </Link>
        )}
        {!state.email && !state.calendar && ' · '}
        {!state.calendar && (
          <Link
            href="/settings#calendar-feed"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            live in your calendar
          </Link>
        )}
      </span>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(NUDGE_KEY, '1');
          setDismissed(true);
        }}
        aria-label="Don't show this again"
        title="Don't show this again"
        className="ml-auto shrink-0 p-0.5 rounded text-slate-300 hover:text-slate-500 dark:text-white/20 dark:hover:text-white/50 transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}
