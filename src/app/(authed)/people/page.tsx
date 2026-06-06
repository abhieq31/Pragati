import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie, isAdmin } from '@/lib/auth';
import { getPeopleDirectory } from '@/lib/peopleDirectory';
import PeopleClient from './PeopleClient';

/**
 * Server-rendered People page — workspace user management. ADMIN ONLY:
 * creating, resetting, unlocking, deleting, and re-roling accounts is
 * reserved for the single workspace admin. Team leads compose their
 * teams from the Team page and never see this surface.
 *
 * The directory payload is read-through cached (it is the same for every
 * admin); see src/lib/peopleDirectory.ts. Only the bounded first page of
 * active contributors is cached — the client paginates / searches the rest
 * against the API, so first paint stays bounded no matter how large the
 * workspace grows.
 */
export default async function PeoplePage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');
  if (!isAdmin(jwt.role)) redirect('/');

  const { users, contribTotal, contribPage } = await getPeopleDirectory();

  return (
    <PeopleClient
      initialUsers={users}
      contribTotal={contribTotal}
      contribPage={contribPage}
      me={{
        id:    jwt.sub,
        name:  jwt.name,
        email: jwt.email,
        role:  jwt.role,
      }}
    />
  );
}
