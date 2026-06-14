'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { api } from '@/lib/client/api';

/**
 * Followers / Following list, in a modal. Opened from the profile hero's
 * social counts — which used to be dead text. Each row links to the person's
 * profile and (for anyone but you) carries a follow / unfollow button so the
 * graph can grow from right here.
 */

export type ConnectionTab = 'followers' | 'following';

type Row = {
  id: string;
  name: string;
  username: string | null;
  role: string;
  avatarLetter: string;
  avatarBg: string;
  avatarFont: number;
  avatarImage: string;
  isSelf: boolean;
  viewerIsFollowing: boolean;
};

function roleText(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'lead' || role === 'pm') return 'Team Lead';
  return 'Member';
}

export function ConnectionsModal({
  userId,
  name,
  tab,
  followerCount,
  followingCount,
  onClose,
}: {
  userId: string;
  name: string;
  tab: ConnectionTab;
  followerCount: number;
  followingCount: number;
  onClose: () => void;
}) {
  const [active, setActive] = useState<ConnectionTab>(tab);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    api<{ users: Row[] }>(`/users/${userId}/connections?rel=${active}`)
      .then((d) => alive && setRows(d.users || []))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [userId, active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function toggle(row: Row) {
    const was = row.viewerIsFollowing;
    setRows((rs) => (rs || []).map((r) => (r.id === row.id ? { ...r, viewerIsFollowing: !was } : r)));
    try {
      await api(`/users/${row.id}/follow`, { method: was ? 'DELETE' : 'POST' });
    } catch {
      setRows((rs) => (rs || []).map((r) => (r.id === row.id ? { ...r, viewerIsFollowing: was } : r)));
    }
  }

  const firstName = name.split(/\s+/)[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overlay-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1e1e1c] shadow-2xl overflow-hidden modal-in flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{firstName}&rsquo;s network</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white/70 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 flex gap-1 border-b border-slate-100 dark:border-white/[0.06]">
            {(
              [
                ['followers', 'Followers', followerCount],
                ['following', 'Following', followingCount],
              ] as [ConnectionTab, string, number][]
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`relative px-3 py-2 text-[13px] font-bold transition-colors ${
                  active === key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'
                }`}
              >
                {label} <span className="tabular-nums">{count}</span>
                {active === key && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto px-2 py-2 min-h-[140px]">
          {rows === null ? (
            <div className="space-y-1.5 p-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 rounded bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-white/[0.05] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-slate-400">
              {active === 'followers' ? `No followers yet.` : `${firstName} isn't following anyone yet.`}
            </div>
          ) : (
            <ul>
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <Link
                    href={r.username ? `/${r.username}` : '#'}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Avatar
                      name={r.name}
                      size={40}
                      letter={r.avatarLetter}
                      bg={r.avatarBg}
                      font={r.avatarFont}
                      image={r.avatarImage}
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {r.username ? `@${r.username}` : roleText(r.role)}
                      </div>
                    </div>
                  </Link>
                  {r.isSelf ? (
                    <span className="text-[11px] font-semibold text-slate-300 dark:text-white/30 px-2">
                      You
                    </span>
                  ) : (
                    <button
                      onClick={() => toggle(r)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition shrink-0 ${
                        r.viewerIsFollowing
                          ? 'border border-slate-200 dark:border-white/15 text-slate-500 dark:text-white/60 hover:border-red-200 hover:text-red-600'
                          : 'border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                      }`}
                    >
                      {r.viewerIsFollowing ? (
                        <>
                          <UserCheck size={13} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} /> Follow
                        </>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
