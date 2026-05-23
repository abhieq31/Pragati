# Pre-launch checklist — Pragati v1.0

Run through this list the morning of the rollout. It only takes ~15 minutes
and catches the failure modes that would embarrass us in front of 35 people.

## 1. Environment

In your production hosting dashboard (Vercel / Render / wherever), confirm
**every one** of these is set:

| Variable | Why it matters | If missing |
| --- | --- | --- |
| `MONGODB_URI` | The database | First API call fails with a clear `[CONFIG]` log line |
| `JWT_SECRET` | Signs auth cookies | signToken/verifyToken throw a clear error on first request in production |
| `ADMIN_EMAIL` | The single admin (super-user) account | No admin is created; only normal leads can sign in. Set this to YOUR email and your account is auto-promoted on next login. |

Email-based password reset has been removed for v1. The admin resets
passwords directly from People → Reset password, generating a temporary
password to share over chat. No SMTP setup required.

Confirmed in your env: ☐

## 2. Build + typecheck

```bash
npm run typecheck   # must exit 0
npm run build       # must exit 0
```

Confirmed: ☐

## 3. E2E suite

```bash
npm run e2e
```

All five spec files green on both desktop and mobile projects. See
[`docs/E2E.md`](./E2E.md) if any fail.

Confirmed: ☐

## 4. Manual smoke (5 minutes, in production)

Sign in to production with **your own admin account** and walk through:

- ☐ Login page shows the new gradient Pragati mark, *not* the old logo image
- ☐ Browser tab favicon is the new Pragati mark (hard-refresh once to clear cache)
- ☐ Dashboard greeting + four summary chips render in the right colours
- ☐ One project in the Projects column expands and shows its task table
- ☐ Actions panel → click *Until…* → calendar pops up **fully visible**,
  not cropped by the Actions box edge
- ☐ Open one project → switch to **Kanban** → arrow buttons appear on
  the sides if there are columns to scroll past
- ☐ Open Settings → toggle **Dark mode** → page recolours to the warm
  Claude-style palette
- ☐ Open a team → see *"Membership is the tag — no separate permissions needed"*
  helper above the member list
- ☐ Click **+ Add member**, add a contributor (employee) to the team
- ☐ Sign in as the admin account (`ADMIN_EMAIL`):
   - ☐ Every team and every project is visible
   - ☐ People page → pick any lead → **Reset password** → temp password
     modal appears with a copyable `Pragati-XXXX` value

## 5. Day-one operational notes

- The **onboarding tour** fires automatically the first time a fresh lead
  signs in, and never returns after they dismiss it. Tell your team this in
  advance so they don't think it's a glitch.
- Dark mode toggle lives in the profile popover (sidebar footer → click
  the user row).
- Adding someone to a team in `/teams/[id]` is the only thing a lead needs
  to do to give that person visibility into all of the team's projects.
  There is no separate "permissions" tab — that's intentional.

## 6. Rollback

If a regression slips in:

```bash
git log --oneline -10               # find the last good commit
git revert <bad-sha>                # revert + push
# Vercel/Render will redeploy automatically
```

The branch is `claude/analyze-pragati-app-JZ6vv`. Every commit on it has a
descriptive message so reverts are surgical.
