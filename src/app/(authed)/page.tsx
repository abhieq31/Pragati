import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { getLeadDashboardData } from '@/lib/leadDashboard';
import DashboardClient from './DashboardClient';

// Server-rendered: data is fetched on the server so the HTML streams with
// real content on the first paint — no client-side waterfall. The onboarding
// tour now lives in the shell (see AppShell), so no per-page tour gate here.
export default async function DashboardPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  const data = await getLeadDashboardData({
    sub: jwt.sub,
    name: jwt.name,
    email: jwt.email,
    role: jwt.role,
  });

  return <DashboardClient initialData={data} />;
}
