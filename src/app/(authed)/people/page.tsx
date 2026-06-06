import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie, isAdmin } from '@/lib/auth';
import { getPeopleDirectory } from '@/lib/peopleDirectory';
import PeopleClient from './PeopleClient';

/**
 * Server-rendered People page — workspace user management. ADMIN ONLY:
 * creating, resetting, unlocking, deleting, and re-roling accounts is
 * reserved for the single workspace admin. Team leads compose their
 * teams from the Team page and never see this surface. The user list is
 * read-through cached (see src/lib/peopleDirectory.ts).
 */
export default async function PeoplePage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');
  if (!isAdmin(jwt.role)) redirect('/');

  const initialUsers = await getPeopleDirectory();

  return (
    <PeopleClient
      initialUsers={initialUsers}
      me={{
        id:    jwt.sub,
        name:  jwt.name,
        email: jwt.email,
        role:  jwt.role,
      }}
    />
  );
}
