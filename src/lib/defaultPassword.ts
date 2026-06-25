/**
 * The workspace's standard default password: `FirstName@employeeId`
 * (e.g. "Abhi Patel" + "29218" → "Abhi@29218").
 *
 * Deterministic on purpose so an admin can communicate it verbally or over
 * chat with no SMTP round-trip; the account is always flagged
 * `mustChangePassword` so the user is forced to set their own on first login.
 *
 * One source of truth, shared by user creation, bulk import, and admin
 * password reset, so the convention can never drift between those paths.
 */
export function defaultPassword(name: string, employeeId: string): string {
  const first = (name || '').trim().split(/\s+/)[0] || 'User';
  return `${first}@${(employeeId || '').trim()}`;
}

/**
 * Whether a meaningful default password can be built. Without an employee ID
 * the default would collapse to "First@" — too weak to hand out — so callers
 * should fall back to a random temporary password in that case.
 */
export function canUseDefaultPassword(employeeId: string | null | undefined): boolean {
  return !!(employeeId && employeeId.trim());
}
