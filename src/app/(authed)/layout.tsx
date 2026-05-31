import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie, normalizeRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import AppShell from '@/components/AppShell';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect('/login');

  // The JWT doesn't carry monogram-avatar fields (they're mutable, the JWT is
  // signed), so pull them off the User document for SSR. Keeps the avatar in
  // the sidebar in sync with the editor without a client-side refetch.
  await connectDB();
  const dbUser = await User.findById(user.sub)
    .select('avatarLetter avatarBg avatarFont soundDropEnabled')
    .lean();

  // Read the dark-mode preference server-side so AppShell mounts in the
  // correct theme on first paint. Eliminates the flash-of-light-content
  // that previously appeared on every navigation when the localStorage
  // useEffect kicked in after hydration.
  const initialDark = cookies().get('theme')?.value === 'dark';

  return (
    <AppShell
      user={{
        id: user.sub,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        title: user.title || '',
        mustChangePassword: user.mustChangePassword,
        hasPin: user.hasPin,
        avatarLetter: (dbUser as any)?.avatarLetter || '',
        avatarBg:     (dbUser as any)?.avatarBg     || '',
        avatarFont:   (dbUser as any)?.avatarFont   ?? 0,
        soundDropEnabled: (dbUser as any)?.soundDropEnabled !== false,
      }}
      initialDark={initialDark}
    >
      {children}
    </AppShell>
  );
}
