'use client';
import { createContext, useContext } from 'react';
import type { CurrentUser } from './AppShell';

const Ctx = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  user, children,
}: { user: CurrentUser; children: React.ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useCurrentUser(): CurrentUser | null {
  return useContext(Ctx);
}

/** True when the current user can mutate projects/tasks (lead or pm). */
export function useIsLead(): boolean {
  const u = useCurrentUser();
  return u?.role === 'lead' || u?.role === 'pm';
}
