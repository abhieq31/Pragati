import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getProjectsPageData } from '@/lib/projectList';
import ProjectsClient from './ProjectsClient';

/**
 * Server-rendered projects list. The initial set of active projects, the
 * team filter options, and the lifecycle options are all resolved on the
 * server (read-through cached per viewer), so the HTML already contains rows
 * on the first paint and no API round-trip is needed before LCP.
 */
export default async function ProjectsPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  const { projects, teams, lifecycles } = await getProjectsPageData(jwt.sub, jwt.role);

  return (
    <ProjectsClient
      initialData={{
        projects,
        teams,
        lifecycles,
      }}
    />
  );
}
