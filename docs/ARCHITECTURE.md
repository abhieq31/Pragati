# Architecture

A high-level map of Pragati for reviewers. For the immutable constraints behind
these choices, see `CLAUDE.md`.

## Stack

- **Next.js 14** (App Router, React Server Components) + **TypeScript**
- **Tailwind CSS** for styling
- **MongoDB** via **Mongoose** (`src/models/*`, cached connection in
  `src/lib/db.ts`)
- **Custom auth** — JWT + bcrypt + httpOnly cookies (`src/lib/auth.ts`,
  `jwt.ts`, `password.ts`). No third-party identity provider.
- **Deterministic QA triage** — rule-based engine (`src/lib/ai/*`), no LLM in
  the scoring path.

## Request / data flow

```mermaid
flowchart LR
  Browser["Browser (client components)"] -->|httpOnly JWT cookie| Edge["Next.js route handler / RSC"]
  Edge -->|getCurrentUserFromCookie / validateSession| Auth["lib/auth + lib/jwt"]
  Edge -->|await connectDB| DB[("MongoDB / Mongoose")]
  Edge -->|Zod validate| Validations["lib/validations"]
  Edge -->|logOperation| Audit[("Audit trail")]
  Edge -->|serialize| Browser
```

- **Reads:** server components call `lib/*` data builders
  (`leadDashboard.ts`, `projectDetail.ts`, `contributions.ts`) directly against
  Mongoose and pass serialized props into client components for first paint.
- **Mutations:** client `api()` calls hit `/api/**` route handlers, which
  `await connectDB()`, validate the body through `lib/validations.ts`, mutate
  via a model, and write an audit entry with `logOperation`.
- **Sessions:** every JWT carries `sv` (sessionVersion) and `sid`
  (activeSessionId); `validateSession` rejects superseded or force-logged-out
  tokens on the next request.

## Component tree (top level)

```mermaid
flowchart TD
  Root["app/layout.tsx (RootLayout)"] --> Authed["(authed)/layout.tsx"]
  Authed --> Shell["AppShell (sidebar, account menu, notifications)"]
  Shell --> Dashboard["DashboardClient"]
  Shell --> Projects["ProjectsClient / ProjectDetailClient"]
  Shell --> Teams["TeamsClient / Team detail"]
  Shell --> People["PeopleClient (admin)"]
  Shell --> MyDay["MyDayClient"]
  Shell --> Settings["SettingsClient"]
  Dashboard --> ActivityGraph["ActivityGraph (lazy)"]
  Settings --> ActivityGraph
```

## Roles

| Capability | Contributor | Lead | Admin |
| ---------- | :---------: | :--: | :---: |
| Work assigned tasks | ✅ | ✅ | ✅ |
| My Day + personal projects | ✅ | ✅ | ✅ |
| Create shared projects / teams, assign work | — | ✅ | ✅ |
| Manage users (People), audit log (Logs) | — | — | ✅ |

Role checks live in `lib/auth.ts` (`isLead`, `isAdmin`, `canMutate`,
`requireRole`) and are enforced **server-side** on every mutating route. The UI
also hides privileged controls (e.g. contributors are locked to personal
projects on `/projects/new`) so the role boundary is felt, not just enforced.

## Key directories

```
src/
  app/
    (authed)/        role-gated pages (dashboard, projects, teams, people, …)
    api/             route handlers — the only place that mutates data
  components/        shared UI (AppShell, ActivityGraph, ui.tsx, …)
  lib/               auth, db, validations, serialize, audit, data builders
  models/            Mongoose schemas (single source of truth for persistence)
docs/                launch checklist, rollout, performance, this file
```

## Compliance touchpoints

- **21 CFR Part 11** — immutable audit trail on every record mutation;
  re-authenticated e-signatures (password + reason) for controlled actions.
- **ALCOA+** — deactivation over deletion keeps records attributable & enduring.
- **GAMP 5 / CSV** — deterministic, unit-testable triage scoring so any severity
  is traceable to a line of code or a KB entry.
