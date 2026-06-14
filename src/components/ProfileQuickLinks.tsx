'use client';
import Link from 'next/link';
import { Newspaper, Compass } from 'lucide-react';

/**
 * Feed + Teammates entry points — "engraved" nameplate pills shown on the
 * profile surfaces (public profile and the editable settings hero) rather than
 * in the global sidebar. These are discovery surfaces that belong with a
 * person's social graph, so they live where the graph does.
 *
 * The letterpress look — inset highlight, uppercase tracking, a soft inner
 * shadow — gives them a crafted, engraved feel without shouting.
 */
const LINKS = [
  { href: '/feed', label: 'Feed', icon: Newspaper, color: '#0891B2' },
  { href: '/teammates', label: 'Teammates', icon: Compass, color: '#DB2777' },
] as const;

export function ProfileQuickLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {LINKS.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-white/55 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_-1px_2px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-px hover:text-slate-700 dark:hover:text-white/80 hover:border-slate-300 dark:hover:border-white/20"
        >
          <Icon size={13} style={{ color }} className="shrink-0 transition-transform group-hover:scale-110" />
          {label}
        </Link>
      ))}
    </div>
  );
}
