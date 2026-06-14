'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Newspaper, Sparkles, Compass } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { api } from '@/lib/client/api';

// Curated reaction set — mirrors src/lib/highlights.ts (server validates).
const REACTIONS = ['👏', '❤️', '💡', '🚀', '🎯'] as const;

const ACCENTS: Record<string, { grad: string; text: string }> = {
  blue: { grad: 'from-blue-500 to-indigo-500', text: '#1d4ed8' },
  green: { grad: 'from-emerald-500 to-teal-500', text: '#047857' },
  violet: { grad: 'from-violet-500 to-fuchsia-500', text: '#7c3aed' },
  amber: { grad: 'from-amber-400 to-orange-500', text: '#b45309' },
  rose: { grad: 'from-rose-500 to-pink-500', text: '#be123c' },
  slate: { grad: 'from-slate-500 to-slate-700', text: '#334155' },
};
const accentOf = (a: string) => ACCENTS[a] || ACCENTS.blue;

export type FeedItem = {
  id: string;
  title: string;
  body: string;
  accent: string;
  createdAt?: string;
  reactions: { emoji: string; count: number }[];
  totalReactions: number;
  myReaction: string | null;
  author: {
    id: string;
    name: string;
    username: string | null;
    avatarLetter: string;
    avatarBg: string;
    avatarFont: number;
    avatarImage: string;
  };
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function FeedClient({ items, followingCount }: { items: FeedItem[]; followingCount: number }) {
  const [feed, setFeed] = useState(items);

  async function react(item: FeedItem, emoji: string) {
    try {
      const updated = await api<FeedItem>(`/users/${item.author.id}/highlights/${item.id}/react`, {
        method: 'POST',
        body: { emoji },
      });
      setFeed((xs) =>
        xs.map((x) =>
          x.id === item.id
            ? {
                ...x,
                reactions: updated.reactions,
                totalReactions: updated.totalReactions,
                myReaction: updated.myReaction,
              }
            : x,
        ),
      );
    } catch {
      /* best-effort */
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-16 page-enter">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #ecfeff, #cffafe)' }}
        >
          <Newspaper size={20} className="text-cyan-600" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Feed
          </h1>
          <p className="text-[12px] text-slate-400 leading-snug">
            Highlights from the {followingCount} {followingCount === 1 ? 'person' : 'people'} you follow.
          </p>
        </div>
      </div>

      {feed.length === 0 ? (
        <EmptyState followingCount={followingCount} />
      ) : (
        <div className="space-y-4">
          {feed.map((item) => {
            const a = accentOf(item.accent);
            return (
              <article key={item.id} className="card overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${a.grad}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Link href={item.author.username ? `/${item.author.username}` : '#'}>
                      <Avatar
                        name={item.author.name}
                        size={40}
                        letter={item.author.avatarLetter}
                        bg={item.author.avatarBg}
                        font={item.author.avatarFont}
                        image={item.author.avatarImage}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={item.author.username ? `/${item.author.username}` : '#'}
                        className="text-[14px] font-bold text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.author.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Sparkles size={11} style={{ color: a.text }} /> shared a highlight ·{' '}
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-3.5 text-[17px] font-black text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  {item.body && (
                    <p className="mt-2 text-[14px] text-slate-600 dark:text-white/65 leading-relaxed whitespace-pre-wrap">
                      {item.body}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                    {REACTIONS.map((e) => {
                      const found = item.reactions.find((r) => r.emoji === e);
                      const count = found?.count || 0;
                      const mine = item.myReaction === e;
                      return (
                        <button
                          key={e}
                          type="button"
                          onClick={() => react(item, e)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[14px] leading-none transition-all hover:scale-105 ${
                            mine
                              ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400/40'
                              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-slate-300'
                          }`}
                          aria-pressed={mine}
                          aria-label={`React ${e}`}
                        >
                          <span>{e}</span>
                          {count > 0 && (
                            <span className="text-[12px] font-bold text-slate-600 dark:text-white/70">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ followingCount }: { followingCount: number }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 grid place-items-center mx-auto mb-4">
        <Newspaper size={26} className="text-cyan-500" />
      </div>
      <h2 className="text-base font-black text-slate-900 dark:text-white">
        {followingCount === 0 ? 'Your feed is quiet' : 'Nothing new yet'}
      </h2>
      <p className="mt-1.5 text-[13px] text-slate-500 dark:text-white/55 max-w-sm mx-auto leading-relaxed">
        {followingCount === 0
          ? 'Follow a few colleagues and their highlights — what they’re building, learning, and aiming for — will show up here.'
          : 'The people you follow haven’t posted highlights yet. Check back soon, or follow a few more colleagues.'}
      </p>
      <Link href="/teammates" className="btn-primary text-sm inline-flex items-center gap-1.5 mt-5">
        <Compass size={15} /> Find teammates
      </Link>
    </div>
  );
}
