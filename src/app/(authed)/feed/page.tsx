import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Highlight } from '@/models/Highlight';
import { serializeHighlight } from '@/lib/highlights';
import FeedClient, { type FeedItem } from './FeedClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Feed · Pragati' };

/**
 * The "Following" feed — highlights from the people you follow, newest first.
 * This is the payoff that makes following worthwhile: a calm, low-noise stream
 * of what your colleagues are building, owning, and aiming for.
 *
 * Scope note: only highlights (member-authored, explicitly shareable) appear
 * here. Completed-task "milestones" are intentionally left out for now — task
 * titles can live in owner-private projects, so surfacing them needs a
 * privacy-filtered activity source rather than a raw Task query.
 */
export default async function FeedPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  await connectDB();
  const me = await User.findById(jwt.sub).select('following').lean();
  const following = (((me as any)?.following || []) as any[]).map((x) => String(x));

  let items: FeedItem[] = [];
  if (following.length) {
    const hs = await Highlight.find({ userId: { $in: following } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();
    const authorIds = Array.from(new Set(hs.map((h) => String(h.userId))));
    const authors = await User.find({ _id: { $in: authorIds } })
      .select('name username avatarLetter avatarBg avatarFont avatarImage')
      .lean();
    const byId = new Map(authors.map((a) => [String(a._id), a]));
    items = hs
      .map((h) => {
        const a: any = byId.get(String(h.userId));
        if (!a) return null;
        const s = serializeHighlight(h, jwt.sub);
        return {
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
          author: {
            id: String(a._id),
            name: a.name,
            username: a.username || null,
            avatarLetter: a.avatarLetter || '',
            avatarBg: a.avatarBg || '',
            avatarFont: typeof a.avatarFont === 'number' ? a.avatarFont : 0,
            avatarImage: a.avatarImage || '',
          },
        } as FeedItem;
      })
      .filter((x): x is FeedItem => x !== null);
  }

  return <FeedClient items={items} followingCount={following.length} />;
}
