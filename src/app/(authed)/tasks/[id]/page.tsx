import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getTaskDetail } from '@/lib/taskDetail';
import TaskDetailClient from './TaskDetailClient';

/**
 * Server-rendered task detail.
 * Pre-fetches the task on the server and hands it to the client component as
 * initial state, so the HTML returned in the first byte already contains real
 * content (no skeleton waiting for a post-hydration fetch). The client still
 * refetches on mount to stay live and to load the scoped roster.
 */
export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  const task = await getTaskDetail(params.id, jwt.sub, jwt.role);

  return (
    <TaskDetailClient
      initialTask={task}
      initialMe={{ id: jwt.sub, name: jwt.name, email: jwt.email, role: jwt.role }}
    />
  );
}
