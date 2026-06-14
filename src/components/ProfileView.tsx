'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Avatar } from '@/components/ui';
import { ProfileHero } from '@/components/ProfileHero';
import {
  Activity,
  Pencil,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Globe,
  Users,
  UserCheck,
  UserPlus,
  CheckCircle2,
  CalendarRange,
  FolderKanban,
  Flame,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { api } from '@/lib/client/api';
import { linkMeta, type LinkBrand } from '@/lib/links';
import { ProfileHighlights } from '@/components/ProfileHighlights';

// Map a detected brand to a lucide icon. Anything without a dedicated mark
// (Medium, Dribbble, a personal site, …) renders the clean Globe chip — its
// brand accent colour still carries the identity.
const BRAND_ICON: Record<LinkBrand, typeof Globe> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  email: Mail,
  medium: Globe,
  dribbble: Globe,
  behance: Globe,
  figma: Globe,
  gitlab: Globe,
  website: Globe,
};

// The contribution heatmap is a sizeable, below-the-fold client component —
// lazy-load it so it never blocks first paint of the profile page.
const ActivityGraph = dynamic(() => import('@/components/ActivityGraph').then((m) => m.ActivityGraph), {
  ssr: false,
  loading: () => <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />,
});

/* A readable text colour from the member's accent: dark accents are used as-is;
   very light ones (peach, sky, mint…) are darkened so accent-coloured text
   stays legible on a white pill. */
function readableAccent(hex?: string | null): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || '').trim());
  if (!m) return '#1565C0';
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luminance > 150) {
    r = Math.round(r * 0.5);
    g = Math.round(g * 0.5);
    b = Math.round(b * 0.5);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/* Animate a number from 0 → target on mount (easeOutCubic). Honours
   prefers-reduced-motion by jumping straight to the value, so the figure is
   never withheld from anyone who's opted out of motion. */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

type StatTileData = {
  label: string;
  value: number;
  sub: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
};

/* A single impact figure — gradient accent line, tinted icon chip and a
   counting-up number. Staggered in via the shared .fade-up-stagger utility so
   the row reveals left-to-right as the profile settles. */
function StatTile({ s, index }: { s: StatTileData; index: number }) {
  const shown = useCountUp(s.value);
  return (
    <div
      className="card fade-up-stagger relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}00)` }}
      />
      <div className="flex items-center gap-2">
        <span
          className="w-8 h-8 rounded-xl grid place-items-center shrink-0"
          style={{ background: s.bg, color: s.color }}
        >
          <s.icon size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
      </div>
      <div className="mt-3 text-[26px] leading-none font-black text-slate-900 dark:text-white tabular-nums">
        {shown}
      </div>
      <div className="text-[11px] text-slate-400 mt-1">{s.sub}</div>
    </div>
  );
}

/**
 * Read-only public profile, shown at /[username]. Any signed-in member can
 * view any colleague's profile — the workspace directory is open by design
 * (see CLAUDE.md). The hero matches the settings page exactly; only the
 * actions differ: your own profile shows "Edit profile" (→ /settings), a
 * colleague's shows a Follow / Unfollow button.
 */
export default function ProfileView({
  profile,
  isSelf,
}: {
  profile: {
    id: string;
    name: string;
    username?: string | null;
    role: string;
    employeeId?: string | null;
    title?: string | null;
    department?: string | null;
    location?: string | null;
    organisation?: string | null;
    avatarLetter?: string;
    avatarBg?: string;
    avatarFont?: number;
    avatarImage?: string;
    githubUrl?: string;
    links?: { url: string; label?: string }[];
    followingCount?: number;
    followerCount?: number;
    viewerIsFollowing?: boolean;
    joinedAt?: string | null;
    stats?: {
      totalDone: number;
      doneThisYear: number;
      projectCount: number;
      streak: number;
    };
  };
  isSelf: boolean;
}) {
  const isLeadOrAdmin = profile.role === 'lead' || profile.role === 'admin';
  const roleText =
    profile.role === 'admin' ? 'Admin' : isLeadOrAdmin ? 'Team Lead' : 'Individual Contributor';

  // Per-member accent, derived from their monogram colour. Personalises the
  // hero cover/ring (handled in ProfileHero) and the Follow CTA / link hovers.
  const accent =
    profile.avatarBg && /^#[0-9a-fA-F]{6}$/.test(profile.avatarBg) ? profile.avatarBg : undefined;
  const accentText = readableAccent(profile.avatarBg);

  // Follow / unfollow state — initialised from the server-rendered prop.
  const [following, setFollowing] = useState(!!profile.viewerIsFollowing);
  const [hoveringFollow, setHoveringFollow] = useState(false);
  const [busy, setBusy] = useState(false);
  // Optimistic follower count
  const [followerCount, setFollowerCount] = useState(profile.followerCount ?? 0);

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    const wasFollowing = following;
    // Optimistic update
    setFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));
    try {
      await api(`/users/${profile.id}/follow`, {
        method: wasFollowing ? 'DELETE' : 'POST',
      });
    } catch {
      // Revert on error
      setFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  const firstName = profile.name.split(/\s+/)[0];

  // The public link row. New profiles use the generic `links` list; older rows
  // may only have the legacy githubUrl — fold it in (deduped) so nothing the
  // member previously saved disappears.
  const allLinks: { url: string; label?: string }[] = [...(profile.links || [])];
  if (profile.githubUrl && !allLinks.some((l) => l.url === profile.githubUrl)) {
    allLinks.unshift({ url: profile.githubUrl });
  }

  // Share affordance — the profile URL is the user's public face inside the
  // workspace; copying it should be one click, not an address-bar ritual.
  const [copied, setCopied] = useState(false);
  function copyLink() {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (http / permissions) — silently skip */
    }
  }

  const joined =
    profile.joinedAt &&
    new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Impact row — server-rendered numbers so the first impression of a profile
  // is what this person delivers, before the heatmap streams in below.
  const stats = profile.stats;
  const statTiles: StatTileData[] = stats
    ? [
        {
          label: 'Delivered',
          value: stats.totalDone,
          sub: 'tasks all-time',
          icon: CheckCircle2,
          color: '#16a34a',
          bg: '#f0fdf4',
        },
        {
          label: 'This year',
          value: stats.doneThisYear,
          sub: new Date().getFullYear().toString(),
          icon: CalendarRange,
          color: '#1565C0',
          bg: '#eff6ff',
        },
        {
          label: 'Projects',
          value: stats.projectCount,
          sub: 'contributed to',
          icon: FolderKanban,
          color: '#7B1FA2',
          bg: '#f3e5f5',
        },
        {
          label: 'Streak',
          value: stats.streak,
          sub: stats.streak === 1 ? 'active day' : 'active days',
          icon: Flame,
          color: '#d97706',
          bg: '#fffbeb',
        },
      ]
    : [];

  // ── Frosted action pill over the cover — legible on any accent colour ──────
  const coverAction = isSelf ? (
    <Link
      href="/settings"
      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-black/30 backdrop-blur px-3.5 py-1.5 text-[12px] font-bold text-slate-700 dark:text-white shadow-sm ring-1 ring-black/5 transition hover:scale-[1.03]"
    >
      <Pencil size={12} /> Edit profile
    </Link>
  ) : (
    <button
      onClick={toggleFollow}
      disabled={busy}
      onMouseEnter={() => setHoveringFollow(true)}
      onMouseLeave={() => setHoveringFollow(false)}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-black/30 backdrop-blur px-3.5 py-1.5 text-[12px] font-bold shadow-sm ring-1 ring-black/5 transition hover:scale-[1.03] disabled:opacity-60"
      style={{
        color: following ? (hoveringFollow ? '#dc2626' : '#16a34a') : accentText,
      }}
    >
      {following ? (
        hoveringFollow ? (
          <>
            <UserCheck size={13} /> Unfollow
          </>
        ) : (
          <>
            <UserCheck size={13} /> Following
          </>
        )
      ) : (
        <>
          <UserPlus size={13} /> Follow
        </>
      )}
    </button>
  );

  // ── Hero footer — social proof + links + share, folded into the hero card ──
  const heroFooter = (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-slate-400" />
          <span>
            <strong className="font-bold text-slate-700 dark:text-white/80">{followerCount}</strong>{' '}
            {followerCount === 1 ? 'follower' : 'followers'}
          </span>
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5">
          <UserCheck size={14} className="text-slate-400" />
          <span>
            follows{' '}
            <strong className="font-bold text-slate-700 dark:text-white/80">
              {profile.followingCount ?? 0}
            </strong>
          </span>
        </span>
        {joined && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">Joined {joined}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {allLinks.map((l, i) => {
          const m = linkMeta(l.url, l.label);
          const Icon = BRAND_ICON[m.brand] || Globe;
          return (
            <a
              key={`${l.url}-${i}`}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              title={m.href}
              className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white/75 transition hover:-translate-y-px hover:border-slate-300 hover:shadow-sm"
            >
              <span style={{ color: m.color }} className="shrink-0">
                <Icon size={14} />
              </span>
              <span className="max-w-[160px] truncate">{m.label}</span>
            </a>
          );
        })}

        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white/75 transition hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300"
          title="Copy a link to this profile"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <LinkIcon size={14} />}
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-5 page-enter">
      <ProfileHero
        name={profile.name}
        username={profile.username}
        roleText={roleText}
        showMemberId={false}
        title={profile.title}
        department={profile.department}
        location={profile.location}
        organisation={profile.organisation}
        accent={accent}
        avatar={
          <Avatar
            name={profile.name}
            size={88}
            letter={profile.avatarLetter}
            bg={profile.avatarBg}
            font={profile.avatarFont}
            image={profile.avatarImage}
          />
        }
        actions={coverAction}
        footer={heroFooter}
      />

      {/* ── Highlights — story-style, text-only ─────────────────────────── */}
      <ProfileHighlights userId={profile.id} isSelf={isSelf} />

      {/* ── Impact row — what this person delivers, at a glance ─────────── */}
      {statTiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statTiles.map((s, i) => (
            <StatTile key={s.label} s={s} index={i} />
          ))}
        </div>
      )}

      {/* ── Activity section ────────────────────────────────────────────── */}
      <div id="activity" className="scroll-mt-6">
        <div className="card rounded-xl border overflow-hidden">
          <div className="section-head px-5 py-4 border-b flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}
            >
              <Activity size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Activity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {isSelf ? 'Your' : `${firstName}'s`} delivered work on Pragati — completed tasks, weighted for
                on-time and priority.
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            <ActivityGraph userId={profile.id} name={profile.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
