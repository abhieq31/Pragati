'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';
import {
  FolderKanban,
  Boxes,
  Users,
  User as UserIcon,
  CheckSquare,
  Sparkles
} from 'lucide-react';

interface SearchResults {
  tasks: Array<{ id: string; title: string; projectId: string; status: string }>;
  projects: Array<{ id: string; name: string; code: string; lifecycle: string }>;
  applications: Array<{ id: string; name: string; key: string }>;
  teams: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email: string; title?: string }>;
}

interface Item {
  kind: 'task' | 'project' | 'application' | 'team' | 'user' | 'nav';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const NAV_ITEMS: Item[] = [
  { kind: 'nav', id: 'nav-dashboard', title: 'My Dashboard', href: '/' },
  { kind: 'nav', id: 'nav-applications', title: 'Applications', href: '/applications' },
  { kind: 'nav', id: 'nav-projects', title: 'Projects', href: '/projects' },
  { kind: 'nav', id: 'nav-teams', title: 'Teams', href: '/teams' },
  { kind: 'nav', id: 'nav-yearly', title: 'Yearly View', href: '/yearly' },
  { kind: 'nav', id: 'nav-org', title: 'Org Overview', href: '/org' },
  { kind: 'nav', id: 'nav-ai-triage', title: 'AI Triage', href: '/ai/triage' },
  { kind: 'nav', id: 'nav-ai-risk', title: 'Deadline Risk', href: '/ai/risk' },
  { kind: 'nav', id: 'nav-new-project', title: 'New project…', href: '/projects/new' }
];

function iconFor(kind: Item['kind']) {
  switch (kind) {
    case 'task':
      return <CheckSquare size={14} />;
    case 'project':
      return <FolderKanban size={14} />;
    case 'application':
      return <Boxes size={14} />;
    case 'team':
      return <Users size={14} />;
    case 'user':
      return <UserIcon size={14} />;
    default:
      return <Sparkles size={14} />;
  }
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    projects: [],
    applications: [],
    teams: [],
    users: []
  });
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  // Cmd/Ctrl-K to open. Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (metaOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Debounced server search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const r = await api<SearchResults>(
          `/search?q=${encodeURIComponent(query.trim())}`
        );
        setResults(r);
        setSelected(0);
      } catch {}
    }, 120);
    return () => clearTimeout(t);
  }, [query, open]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navMatches = q
      ? NAV_ITEMS.filter((n) => n.title.toLowerCase().includes(q))
      : NAV_ITEMS.slice(0, 6);
    const tasks: Item[] = results.tasks.map((t) => ({
      kind: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.status,
      href: `/tasks/${t.id}`
    }));
    const projects: Item[] = results.projects.map((p) => ({
      kind: 'project',
      id: p.id,
      title: p.name,
      subtitle: p.code,
      href: `/projects/${p.id}`
    }));
    const applications: Item[] = results.applications.map((a) => ({
      kind: 'application',
      id: a.id,
      title: `${a.key} · ${a.name}`,
      href: `/applications/${a.id}`
    }));
    const teams: Item[] = results.teams.map((t) => ({
      kind: 'team',
      id: t.id,
      title: t.name,
      href: `/teams/${t.id}`
    }));
    const users: Item[] = results.users.map((u) => ({
      kind: 'user',
      id: u.id,
      title: u.name,
      subtitle: u.title || u.email,
      href: `/yearly/${u.id}`
    }));
    // Navigation first, then search matches
    return [...navMatches, ...tasks, ...projects, ...applications, ...teams, ...users];
  }, [results, query]);

  function go(item: Item) {
    router.push(item.href);
    close();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(items.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = items[selected];
      if (chosen) go(chosen);
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <span className="text-slate-400">⌘K</span>
          <input
            ref={inputRef}
            className="flex-1 outline-none text-sm"
            placeholder="Search tasks, projects, applications, people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nothing matches &ldquo;{query}&rdquo;
            </div>
          ) : (
            items.map((it, i) => (
              <button
                key={`${it.kind}-${it.id}`}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${
                  i === selected ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setSelected(i)}
                onClick={() => go(it)}
              >
                <span className="text-slate-400">{iconFor(it.kind)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.title}</div>
                  {it.subtitle && (
                    <div className="text-xs text-slate-500 truncate">{it.subtitle}</div>
                  )}
                </div>
                <span className="text-[10px] uppercase text-slate-400">{it.kind}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 text-[11px] text-slate-500 border-t bg-slate-50 flex gap-3">
          <span>
            <kbd className="px-1 rounded bg-white border">↑</kbd>{' '}
            <kbd className="px-1 rounded bg-white border">↓</kbd> navigate
          </span>
          <span>
            <kbd className="px-1 rounded bg-white border">↵</kbd> open
          </span>
          <span className="ml-auto">
            Press <kbd className="px-1 rounded bg-white border">⌘</kbd>
            <kbd className="px-1 rounded bg-white border">K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>
  );
}
