'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Users,
  UsersRound,
  ShieldCheck,
  NotebookPen,
  ScrollText,
  UserCircle,
  Moon,
  Sun,
  Keyboard,
  LogOut,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/client/api';

/**
 * Global Cmd/Ctrl+K command palette — jump to any page, action, project, or
 * team without leaving the keyboard. Static entries (pages/actions) are
 * free; project/team search costs one debounced request each, scoped by
 * the same permission filters as their list pages (the palette is a faster
 * door into existing data, never a new read path).
 */

type Role = 'contributor' | 'lead' | 'admin' | 'master_admin';

export interface PaletteUser {
  name: string;
  role: Role;
  username?: string | null;
}

interface Entry {
  id: string;
  label: string;
  sublabel?: string;
  icon: any;
  run: () => void;
}

interface Section {
  title: string;
  entries: Entry[];
}

const MIN_QUERY = 2;
const MAX_DYNAMIC = 6;
const DEBOUNCE_MS = 220;

export function CommandPalette({
  open,
  onClose,
  dark,
  user,
  onToggleDark,
  onOpenShortcuts,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  user: PaletteUser;
  onToggleDark: () => void;
  onOpenShortcuts: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [projectResults, setProjectResults] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin' || user.role === 'master_admin';

  // Reset to a clean slate every time the palette opens, and focus the input.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Teams list is small workspace-wide data — fetch once per palette session
  // (not per keystroke) and filter client-side.
  useEffect(() => {
    if (!open || teams !== null) return;
    api<{ id: string; name: string }[]>('/teams')
      .then((rows) => setTeams(rows.map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => setTeams([]));
  }, [open, teams]);

  // Debounced live project search — reuses the same ?q= the Projects page
  // search box hits, so results respect the viewer's existing visibility scope.
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < MIN_QUERY) {
      setProjectResults([]);
      return;
    }
    const t = setTimeout(() => {
      api<{ id: string; name: string; code?: string }[]>(`/projects?q=${encodeURIComponent(term)}`)
        .then((rows) => setProjectResults(rows.slice(0, MAX_DYNAMIC)))
        .catch(() => setProjectResults([]));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => setActiveIndex(0), [query]);

  const go = (href: string) => () => router.push(href);

  const pages: Entry[] = useMemo(() => {
    const items: Entry[] = [
      { id: 'p-dash', label: 'Dashboard', icon: LayoutDashboard, run: go('/') },
      { id: 'p-projects', label: 'Projects', icon: FolderKanban, run: go('/projects') },
      { id: 'p-teams', label: 'Teams', icon: Users, run: go('/teams') },
      { id: 'p-myday', label: 'My Day', icon: NotebookPen, run: go('/my-day') },
      { id: 'p-settings', label: 'Profile & activity', icon: UserCircle, run: go('/settings') },
    ];
    if (user.username) {
      items.push({ id: 'p-profile', label: 'My public profile', icon: UserCircle, run: go(`/${user.username}`) });
    }
    if (isAdmin) {
      items.push(
        { id: 'p-console', label: 'Admin console', icon: ShieldCheck, run: go('/admin') },
        { id: 'p-people', label: 'People', icon: UsersRound, run: go('/people') },
        { id: 'p-audit', label: 'Audit log', icon: ScrollText, run: go('/audit') },
      );
    }
    if (user.role === 'master_admin') {
      items.push({ id: 'p-master', label: 'Platform (master admin)', icon: Globe, run: go('/master-admin') });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.username, user.role, isAdmin]);

  const actions: Entry[] = useMemo(
    () => [
      {
        id: 'a-dark',
        label: dark ? 'Switch to light mode' : 'Switch to dark mode',
        icon: dark ? Sun : Moon,
        run: onToggleDark,
      },
      { id: 'a-shortcuts', label: 'Keyboard shortcuts', icon: Keyboard, run: onOpenShortcuts },
      { id: 'a-logout', label: 'Sign out', icon: LogOut, run: onLogout },
    ],
    [dark, onToggleDark, onOpenShortcuts, onLogout],
  );

  const term = query.trim().toLowerCase();
  const matches = (label: string) => !term || label.toLowerCase().includes(term);

  const projectEntries: Entry[] = projectResults.map((p) => ({
    id: `proj-${p.id}`,
    label: p.name,
    sublabel: p.code,
    icon: FolderKanban,
    run: go(`/projects/${p.id}`),
  }));
  const teamEntries: Entry[] = (teams || [])
    .filter((t) => matches(t.name))
    .slice(0, MAX_DYNAMIC)
    .map((t) => ({ id: `team-${t.id}`, label: t.name, icon: Users, run: go(`/teams/${t.id}`) }));

  const sections: Section[] = [
    { title: 'Pages', entries: pages.filter((p) => matches(p.label)) },
    { title: 'Actions', entries: actions.filter((a) => matches(a.label)) },
    { title: 'Projects', entries: projectEntries },
    { title: 'Teams', entries: teamEntries },
  ].filter((s) => s.entries.length > 0);

  const flat = sections.flatMap((s) => s.entries);
  const safeIndex = flat.length ? Math.min(activeIndex, flat.length - 1) : 0;

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${safeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex]);

  if (!open) return null;

  function activate(entry: Entry | undefined) {
    if (!entry) return;
    entry.run();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(flat[safeIndex]);
    }
  }

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-[560px] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: dark ? '#262624' : '#ffffff',
          border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div
          className="flex items-center gap-2.5 px-4 border-b"
          style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#eef2f7' }}
        >
          <Search size={16} className={dark ? 'text-white/35' : 'text-slate-400'} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, projects, teams…"
            className={`flex-1 h-12 bg-transparent outline-none text-sm ${
              dark ? 'text-white/90 placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className={`px-4 py-8 text-center text-sm ${dark ? 'text-white/30' : 'text-slate-400'}`}>
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            sections.map((s) => (
              <div key={s.title} className="mb-1.5">
                <div
                  className={`px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${
                    dark ? 'text-white/30' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </div>
                {s.entries.map((entry) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const active = idx === safeIndex;
                  const Icon = entry.icon;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      data-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => activate(entry)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                        active
                          ? dark
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-100 text-slate-900'
                          : dark
                            ? 'text-white/70'
                            : 'text-slate-600'
                      }`}
                    >
                      <Icon size={15} className="shrink-0 opacity-70" />
                      <span className="flex-1 truncate">{entry.label}</span>
                      {entry.sublabel && (
                        <span className={`text-[11px] shrink-0 ${dark ? 'text-white/30' : 'text-slate-400'}`}>
                          {entry.sublabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className={`flex items-center gap-3 px-4 py-2 border-t text-[11px] ${
            dark ? 'border-white/[0.08] text-white/35' : 'border-slate-100 text-slate-400'
          }`}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
