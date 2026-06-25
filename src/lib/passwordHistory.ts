import bcrypt from 'bcryptjs';

/**
 * Password-reuse policy, shared by the change-password and forced
 * first-password flows so the two can't drift apart.
 *
 * A new password may not match the *current* password or any of the recent
 * history entries. Checking the current hash matters: an admin reset sets the
 * password directly (it never enters history), so without this a user could
 * "change" their default password to the very same default and stay on it.
 */
export const PASSWORD_HISTORY_LENGTH = 3;

/** True if `plain` matches the current password or any kept history hash. */
export function isPasswordReused(
  plain: string,
  currentHash: string | null | undefined,
  history: string[] = [],
): boolean {
  const hashes = [currentHash, ...history].filter((h): h is string => !!h);
  return hashes.some((h) => bcrypt.compareSync(plain, h));
}

/** Prepend the current hash onto history, keeping the most recent N. */
export function pushPasswordHistory(
  currentHash: string,
  history: string[] = [],
  keep: number = PASSWORD_HISTORY_LENGTH,
): string[] {
  return [currentHash, ...history].slice(0, keep);
}

/** The user-facing message when a reuse is rejected. */
export const PASSWORD_REUSE_MESSAGE =
  'Pick a password you have not used recently — not your current or last 3.';
