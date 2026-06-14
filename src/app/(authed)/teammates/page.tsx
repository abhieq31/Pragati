import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import TeammatesClient, { type Member } from './TeammatesClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Teammates · Pragati' };

/**
 * Member directory — a read-only, browse-and-follow surface for *everyone*
 * (the admin-only /people page is for account management, not discovery).
 * Without a place to find colleagues, the follow graph can't grow; this is it.
 *
 * "Suggested for you" surfaces people you actually collaborate with — anyone
 * assigned to a task in a project you also have tasks in — that you don't yet
 * follow, so the first follows are the relevant ones.
 */
export default async function TeammatesPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  await connectDB();
  const meId = jwt.sub;
  const meDoc = await User.findById(meId).select('following').lean();
  const following = new Set((((meDoc as any)?.following || []) as any[]).map((x) => String(x)));

  const [people, myProjectIds] = await Promise.all([
    User.find({ active: { $ne: false } })
      .select('name username role title department avatarLetter avatarBg avatarFont avatarImage')
      .lean(),
    Task.distinct('projectId', { assigneeId: meId }),
  ]);

  let collaborators = new Set<string>();
  if (myProjectIds.length) {
    const ids = await Task.distinct('assigneeId', { projectId: { $in: myProjectIds } });
    collaborators = new Set((ids as any[]).map((x) => String(x)));
    collaborators.delete(meId);
  }

  const members: Member[] = people
    .map((p: any) => ({
      id: String(p._id),
      name: p.name,
      username: p.username || null,
      role: p.role || 'contributor',
      title: p.title || '',
      department: p.department || '',
      avatarLetter: p.avatarLetter || '',
      avatarBg: p.avatarBg || '',
      avatarFont: typeof p.avatarFont === 'number' ? p.avatarFont : 0,
      avatarImage: p.avatarImage || '',
      isSelf: String(p._id) === meId,
      viewerIsFollowing: following.has(String(p._id)),
      isCollaborator: collaborators.has(String(p._id)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <TeammatesClient members={members} />;
}
