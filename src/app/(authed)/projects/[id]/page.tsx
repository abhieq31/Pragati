import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getProjectDetail } from '@/lib/projectDetail';
import ProjectDetailClient from './ProjectDetailClient';

/**
 * Server-rendered project detail.
 * Pre-fetches the project + its tasks on the server and hands the payload
 * to the client component as initial state, so the HTML returned in the
 * first byte already contains real content (no skeleton waiting for a
 * post-hydration fetch). The client still refetches on mount to stay live
 * and to load the scoped assignee roster.
 */
export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  const project = await getProjectDetail(params.id, jwt.sub, jwt.role);

  return (
    <ProjectDetailClient
      initialProject={project}
      initialMe={{ id: jwt.sub, name: jwt.name, email: jwt.email, role: jwt.role }}
    />
  );
}
