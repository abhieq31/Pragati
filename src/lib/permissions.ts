/**
 * Central capability matrix — the single source of truth for "which role may
 * do what" across the whole workspace.
 *
 * Why a matrix instead of scattered `isAdmin()` checks: every new surface
 * (page, API route, button) asks the same question — "can this role do this
 * thing?" — and the answer must be identical on the server (route guards),
 * in server components (page gates) and in the client (showing/hiding
 * controls). Keeping the answer in one table makes the product behave
 * consistently, makes the role model reviewable at a glance, and gives a
 * future multi-tenant deployment one place to extend (per-tenant plans can
 * narrow this table without touching call sites).
 *
 * This module is deliberately dependency-free (no DB, no next/headers) so it
 * is importable from client components and route handlers alike.
 */

export type Role = 'contributor' | 'lead' | 'admin' | 'master_admin';

/** Coerce any stored/legacy role string to a current Role (mirrors lib/auth). */
export function toRole(role?: string | null): Role {
  if (role === 'master_admin') return 'master_admin';
  if (role === 'admin') return 'admin';
  if (role === 'lead' || role === 'pm') return 'lead';
  return 'contributor';
}

export type Capability =
  /** Unrestricted read scope: every team, every shared project, every task.
   *  Personal projects stay private to their owners — even from admins. */
  | 'workspace.view_all'
  /** The /admin console — workspace metrics, attention queue, recent audit. */
  | 'admin.console'
  /** People directory: create/edit/deactivate/delete accounts, change roles. */
  | 'users.manage'
  /** Batch lifecycle actions over many accounts in one signed operation. */
  | 'users.bulk_manage'
  /** Revoke every active session of an account immediately. */
  | 'users.force_logout'
  /** Read the cross-user operational audit trail. */
  | 'audit.view'
  /** Create / revoke invites for new lead accounts. */
  | 'invites.manage'
  /** Configure the workspace-wide daily email digest. */
  | 'digest.configure'
  /** Create teams, edit any team's name/members, delete teams. */
  | 'teams.manage'
  /** Create shared (non-personal) projects and assign work. */
  | 'projects.create_shared'
  /** Delete any shared project (owners can always delete their own). */
  | 'projects.delete_any'
  /** Delete tasks/phases in projects the actor does not own. */
  | 'tasks.delete_any';

const LEAD_UP: Role[] = ['lead', 'admin', 'master_admin'];
const ADMIN_UP: Role[] = ['admin', 'master_admin'];

export const CAPABILITIES: Record<Capability, readonly Role[]> = {
  'workspace.view_all': ADMIN_UP,
  'admin.console': ADMIN_UP,
  'users.manage': ADMIN_UP,
  'users.bulk_manage': ADMIN_UP,
  'users.force_logout': ADMIN_UP,
  'audit.view': ADMIN_UP,
  'invites.manage': ADMIN_UP,
  'digest.configure': ADMIN_UP,
  'teams.manage': LEAD_UP,
  'projects.create_shared': LEAD_UP,
  'projects.delete_any': ADMIN_UP,
  'tasks.delete_any': ADMIN_UP,
};

/** Whether `role` holds `capability`. Accepts raw/legacy role strings. */
export function can(role: string | null | undefined, capability: Capability): boolean {
  return CAPABILITIES[capability].includes(toRole(role));
}

/** Roles holding `capability` — spread into requireRole(req, ...rolesWith(c))
 *  so route guards and this table can never drift apart. */
export function rolesWith(capability: Capability): Role[] {
  return [...CAPABILITIES[capability]];
}
