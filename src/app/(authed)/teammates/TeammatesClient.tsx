'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Compass, Search, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { api } from '@/lib/client/api';

export type Member = {
  id: string;
  name: string;
  username: string | null;
  role: string;
  title: string;
  department: string;
  avatarLetter: string;
  avatarBg: string;
  avatarFont: number;
  avatarImage: string;
  isSelf: boolean;
  viewerIsFollowing: boolean;
  isCollaborator: boolean;
};

function roleText(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'lead' || role === 'pm') return 'Team Lead';
  return 'Member';
}

function subtitle(m: Member) {
  return [m.title, m.department].filter(Boolean).join(' · ') || roleText(m.role);
}

export default function TeammatesClient({ members }: { members: Member[] }) {
  const [list, setList] = useState(members);
  const [q, setQ] = useState('');

  async function toggle(m: Member) {
    const was = m.viewerIsFollowing;
    setList((xs) => xs.map((x) => (x.id === m.id ? { ...x, viewerIsFollowing: !was } : x)));
    try {
      await api(`/users/${m.id}/follow`, { method: was ? 'DELETE' : 'POST' });
    } catch {
      setList((xs) => xs.map((x) => (x.id === m.id ? { ...x, viewerIsFollowing: was } : x)));
    }
  }

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      !query
        ? list
        : list.filter((m) =>
            [m.name, m.username || '', m.title, m.department].join(' ').toLowerCase().includes(query),
          ),
    [list, query],
  );

  // People you actually work with and don't yet follow — the high-signal first
  // follows. Hidden while searching (the search is the discovery tool then).
  const suggestions = useMemo(
    () => list.filter((m) => m.isCollaborator && !m.viewerIsFollowing && !m.isSelf).slice(0, 8),
    [list],
  );

  return (
    <div className="max-w-4xl mx-auto pb-16 page-enter">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}
        >
          <Compass size={20} className="text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Teammates
          </h1>
          <p className="text-[12px] text-slate-400 leading-snug">
            Find colleagues to follow — their highlights show up in your feed.
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, @handle, title, team…"
          className="input w-full pl-9"
        />
      </div>

      {!query && suggestions.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={13} className="text-amber-500" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggested — people you work with
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestions.map((m) => (
              <div key={m.id} className="card p-4 flex flex-col items-center text-center">
                <Link href={m.username ? `/${m.username}` : '#'}>
                  <Avatar
                    name={m.name}
                    size={56}
                    letter={m.avatarLetter}
                    bg={m.avatarBg}
                    font={m.avatarFont}
                    image={m.avatarImage}
                  />
                </Link>
                <Link
                  href={m.username ? `/${m.username}` : '#'}
                  className="mt-2.5 text-[13px] font-bold text-slate-800 dark:text-white truncate max-w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {m.name}
                </Link>
                <div className="text-[11px] text-slate-400 truncate max-w-full">{subtitle(m)}</div>
                <FollowButton m={m} onToggle={() => toggle(m)} className="mt-3 w-full justify-center" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {query ? `Results` : 'All members'} <span className="tabular-nums">({filtered.length})</span>
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-[13px] text-slate-400">
          No teammates match &ldquo;{q}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="card p-3.5 flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={m.username ? `/${m.username}` : '#'} className="shrink-0">
                <Avatar
                  name={m.name}
                  size={44}
                  letter={m.avatarLetter}
                  bg={m.avatarBg}
                  font={m.avatarFont}
                  image={m.avatarImage}
                />
              </Link>
              <Link href={m.username ? `/${m.username}` : '#'} className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                  {m.name}
                  {m.isSelf && <span className="ml-1.5 text-[10px] font-semibold text-slate-300">you</span>}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{subtitle(m)}</div>
              </Link>
              {!m.isSelf && <FollowButton m={m} onToggle={() => toggle(m)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowButton({
  m,
  onToggle,
  className = '',
}: {
  m: Member;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition shrink-0 ${
        m.viewerIsFollowing
          ? 'border border-slate-200 dark:border-white/15 text-slate-500 dark:text-white/60 hover:border-red-200 hover:text-red-600'
          : 'border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'
      } ${className}`}
    >
      {m.viewerIsFollowing ? (
        <>
          <UserCheck size={13} /> Following
        </>
      ) : (
        <>
          <UserPlus size={13} /> Follow
        </>
      )}
    </button>
  );
}
