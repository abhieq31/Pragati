'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { MapPin, Building2, Briefcase, Fingerprint } from 'lucide-react';

/**
 * Shared profile hero — used on both the editable settings page (self) and
 * the read-only public profile at /[username].
 *
 * Design: a flat identity row, not a cover banner. The old gradient-banner
 * treatment read as a social-network relic; this one leads with the person —
 * a brand-ring avatar, name + role side by side, and quiet metadata — so the
 * page gets to the substance (impact numbers, activity) one beat sooner.
 * Keeping one component means a user's profile looks identical whether
 * they're editing their own or viewing a colleague's.
 */
export function ProfileHero({
  name,
  username,
  roleText,
  employeeId,
  title,
  department,
  location,
  organisation,
  avatar,
  actions,
  linkUsername = false,
  showMemberId = true,
}: {
  name: string;
  username?: string | null;
  roleText: string;
  employeeId?: string | null;
  title?: string | null;
  department?: string | null;
  location?: string | null;
  organisation?: string | null;
  /** The avatar node (editable button on settings, plain Avatar on public). */
  avatar: ReactNode;
  /** Right-side action slot — Edit (self) or nothing (public). */
  actions?: ReactNode;
  /** When true, @username links to the public profile route. */
  linkUsername?: boolean;
  /** Member ID is internal — hidden on the public profile view. */
  showMemberId?: boolean;
}) {
  const meta = [
    title ? { icon: Briefcase, text: title } : null,
    department || organisation
      ? { icon: Building2, text: [department, organisation].filter(Boolean).join(' · ') }
      : null,
    location ? { icon: MapPin, text: location } : null,
    showMemberId && employeeId ? { icon: Fingerprint, text: `ID ${employeeId}` } : null,
  ].filter(Boolean) as { icon: any; text: string }[];

  const handle = username ? (
    linkUsername ? (
      <Link
        href={`/${username}`}
        className="font-mono text-[13px] text-slate-400 dark:text-white/40 break-all hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
      >
        @{username}
      </Link>
    ) : (
      <span className="font-mono text-[13px] text-slate-400 dark:text-white/40 break-all">@{username}</span>
    )
  ) : null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Brand-ring avatar — the one decorative element the hero keeps. */}
        <div
          className="shrink-0 self-start sm:self-auto rounded-full p-[3px]"
          style={{
            background: 'conic-gradient(from 210deg, #1565C0, #2E7D32, #1976D2, #1565C0)',
          }}
        >
          <div className="rounded-full p-[3px] bg-white dark:bg-[#262624]">{avatar}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-slate-900 dark:text-white break-words">
              {name}
            </h1>
            <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/55">
              {roleText}
            </span>
          </div>

          {handle && <div className="mt-1">{handle}</div>}

          {meta.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {meta.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-white/45"
                >
                  <m.icon size={12} className="text-slate-300 dark:text-white/25 shrink-0" />
                  {m.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && <div className="shrink-0 self-start flex items-center gap-1.5">{actions}</div>}
      </div>
    </section>
  );
}
