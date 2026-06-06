import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getTeamDetail } from '@/lib/teamDetail';
import TeamDetailClient from './TeamDetailClient';

/**
 * Server-rendered team detail.
 * Pre-fetches the team + board tasks on the server and passes the payload
 * to the client component as initial state — identical pattern to the
 * project detail page so the first HTML byte contains real content with
 * no post-hydration waterfall for the critical data.
 *
 * The analytics/progress data (lead-only aggregation) is still fetched
 * client-side by TeamDetailClient since it's secondary, role-gated, and
 * does not block the main content from rendering.
 */
export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  const detail = await getTeamDetail(params.id, jwt.sub, jwt.role);

  // Team not found or viewer is not a member — let the client component
  // show the "Team unavailable" error rather than hard-crashing the page.
  if (!detail) {
    return (
      <TeamDetailClient
        initialTeam={null}
        initialBoard={[]}
      />
    );
  }

  return (
    <TeamDetailClient
      initialTeam={detail.team}
      initialBoard={detail.board}
    />
  );
}
