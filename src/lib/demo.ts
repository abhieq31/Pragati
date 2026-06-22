/**
 * Public demo accounts — the shared identity used by both the demo seed
 * (`npm run seed:demo`) and the auth path.
 *
 * These accounts live on the `@pragati.local` domain with a `demo.` local-part
 * prefix and a password that is *published in the README*. Because the password
 * is intentionally public, the brute-force lockout protects nothing for them —
 * it only hands any visitor a one-click way to take the live demo down: type a
 * wrong password five times and the shared account locks until an admin clears
 * it (and the lockout wall then refuses even the correct, published password).
 * So these accounts are treated as never-lockable, and a successful login
 * clears any lock that an earlier visitor left behind.
 *
 * The pattern is deliberately narrow: the local-part must start with `demo.`
 * AND contain no `@`, AND the domain must be exactly `pragati.local` — so a
 * real user account can never be caught by it.
 */
export const DEMO_EMAIL_RX = /^demo\.[^@]*@pragati\.local$/i;

export function isDemoAccount(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAIL_RX.test(email.trim());
}
