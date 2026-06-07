# Pragati

> Project intelligence for QA-IT teams in pharma. A bird's-eye view of every project, every action, every contributor — minus the noise.

[![CI](https://img.shields.io/badge/CI-passing-22c55e.svg)](#testing)
[![Stack](https://img.shields.io/badge/stack-Next.js%2014%20·%20MongoDB%20·%20TypeScript-1565C0.svg)](#stack)
[![Compliance](https://img.shields.io/badge/21%20CFR%20Part%2011-aware-9333EA.svg)](./CLAUDE.md)
[![License](https://img.shields.io/badge/license-Private-64748b.svg)](#license)

---

## What it is

A lightweight project + task tracker built for QA-IT teams in the pharmaceutical sector. Invite-only — no public sign-ups, no marketing pages.

Roles:

| Role | What they see |
| --- | --- |
| **Contributor** | Their own tasks, their My Day, their personal projects. |
| **Team Lead** | Their teams, projects and tasks; assigns work; tracks progress. |
| **Admin** | Full workspace control, user management, operations + audit log. |
| **Master Admin** (dormant) | Cross-tenant provisioning, when multi-tenant runtime is enabled. |

## Highlights

- **Bird's-eye view** — a full-screen SVG tree of `team → project → task → assignee`. Opens from the dashboard, team detail, or project detail page. Export as PDF, SVG, or image.
- **Mind map on My Day** — a personal node-link canvas for capturing thoughts before they become tasks. Owner-private, autosaves per user.
- **Lifecycle templates** — Change Control, CSV/GAMP 5, SOP Dev, CAPA, Deviation, Audit, Validation, Agile Sprint, plus six regulatory operations templates (Regulatory Submission, System Retirement, Incident Management, Vendor Qualification, Training Program, Product Recall) and Personal templates for ICs. The picker is categorised and collapsed by default.
- **ALCOA+ audit trail** — every record change carries a signed, immutable trail (who, what, when, why). Personal projects never enter the cross-user log. Editing a project's Change Control reference (`ccNo`) writes a before/after GxP record.
- **Public profiles** — a within-workspace profile at `/<username>` with a contribution heatmap, an optional GitHub link, and Follow / Unfollow for colleagues.
- **Sidebar calendar** — a compact month grid pinned above My Day, dotted with what's due (mine / team / overdue) and a hover card listing the day's work.
- **Dashboard "Up Next"** — colour-coded urgency pills (overdue / today / ≤2d / future) on every due-row, with filter chips (week / next week / month / until-date).
- **Activity graph** — GitHub-style contribution heatmap with role-based achievements (Milestone Achiever, On-Time Streak, Project Finisher, Mentor, Load Balancer, …).
- **Reports** — Excel (interactive), PDF, CSV, HTML exports for both projects and teams. Print preview before save.
- **Productivity touches** — resizable sidebar (drag the edge, persisted), global keyboard shortcuts (`G D/P/T/M` to navigate, `?` for the shortcut sheet), custom team avatars (resized client-side), and per-page loading skeletons that mirror each real layout.

## Security & data integrity

- **Hand-rolled auth** — JWT + bcrypt + httpOnly cookie, one active session per user, idle auto-logout, brute-force lockout.
- **Credential reuse prevention** — passwords and Quick PINs cannot repeat any of the last three used, enforced server-side on every change.
- **E-signatures** — controlled status changes and sensitive account edits require password re-entry plus a reason, recorded verbatim in the audit trail (21 CFR Part 11 §11.10/§11.50/§11.200).
- **Read-through cache** — optional Upstash Redis layer on hot aggregations (dashboard, projects, people), inert when the env vars are absent.

## Run locally

```bash
cp .env.example .env.local        # set MONGODB_URI, JWT_SECRET, APP_URL
npm install
npm run dev                       # http://localhost:3000
```

For an isolated dev DB without Atlas:

```bash
USE_IN_MEMORY_MONGO=true npm run dev
```

> The in-memory mode downloads a Mongo binary on first start. If MongoDB's archive 403s a particular version, override with `MONGOMS_VERSION=7.0.7` (or any [available release](https://www.mongodb.com/download-center/community/releases/archive)).

## Demo data

Drop a believable workspace into your existing database with one command:

```bash
npm run seed:demo                 # 30 users, 6 teams, 14 projects, mixed task statuses
npm run seed:demo -- --clean      # wipe demo records (real data untouched)
```

Demo accounts (password `Demo@1234`):

| Email | Role |
| --- | --- |
| `demo.lead@pragati.local` | Team Lead (best for screen-recordings) |
| `demo.ic@pragati.local` | Individual Contributor |
| `demo.<first>@pragati.local` | 13 supporting contributors |

Details: [`docs/DEMO_ENVIRONMENT.md`](./docs/DEMO_ENVIRONMENT.md).

## Production

Full launch runbook (env vars, smoke test, uptime monitor, rollback): [`docs/LAUNCH_CHECKLIST.md`](./docs/LAUNCH_CHECKLIST.md).

Performance budgets and profiling guide: [`docs/PERFORMANCE.md`](./docs/PERFORMANCE.md).

## Stack

Next.js 14 (App Router) · TypeScript · MongoDB / Mongoose · Zod · Tailwind · JWT + bcrypt + httpOnly cookie. No NextAuth, no Prisma, no third-party identity provider — by design, for 21 CFR Part 11 §11.10(d) traceability.

Server-rendered detail pages with streaming Suspense skeletons; an Edge middleware cookie pre-filter for auth; an optional Upstash Redis read-through cache on hot aggregations (inert without env vars); and Vercel serverless functions pinned to `bom1` (Mumbai) to co-locate with the Atlas `ap-south-1` cluster.

Architecture deep-dive: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── (authed)/             # authenticated surfaces (shared AppShell layout)
│   │   ├── page.tsx          # dashboard
│   │   ├── projects/         # list · new · [id] detail
│   │   ├── teams/            # list · [id] detail
│   │   ├── people/           # admin-only user directory
│   │   ├── my-day/           # personal tasks + mind map
│   │   ├── settings/         # profile, security, preferences
│   │   ├── audit/            # immutable operations log
│   │   └── [username]/       # public-within-workspace profile
│   ├── api/                  # route handlers (auth, projects, tasks, teams, users…)
│   ├── login/                # unauthenticated entry
│   └── globals.css           # Tailwind layer + design tokens
├── components/               # UI — AppShell, SidebarCalendar, SkeletonScreens, ProfileView…
├── lib/                      # server + client logic
│   ├── ai/                   # rule-based triage + KB (never an LLM on the scoring path)
│   ├── flow/                 # Flow Signal meaningful-activity engine
│   ├── client/               # browser-only helpers (api client, hooks)
│   ├── auth.ts               # JWT sign/verify, sessions, bcrypt, RBAC helpers
│   ├── validations.ts        # central Zod schemas — the API boundary contract
│   ├── cache.ts              # optional Upstash read-through cache
│   └── serialize.ts          # Mongoose doc → JSON-safe shapes
├── models/                   # Mongoose schemas (User, Team, Project, Task, AuditLog…)
└── middleware.ts             # Edge cookie pre-filter for authed routes

docs/                         # ARCHITECTURE · PERFORMANCE · LAUNCH_CHECKLIST · E2E · ROLLOUT…
scripts/                      # operator + seed CLIs (tsx)
tests/                        # unit (node:test) + e2e (Playwright)
```

## Architectural invariants

The constraints in [`CLAUDE.md`](./CLAUDE.md) are not suggestions:

- **QA triage engine** stays rule-based — never an LLM call on the scoring path.
- **Auth** stays hand-rolled (JWT + bcrypt + httpOnly cookie). No NextAuth, Clerk, Auth0, Supabase Auth.
- **Persistence** stays Mongoose. No Prisma, Drizzle, TypeORM.
- **API bodies** validate through the central Zod schemas in `src/lib/validations.ts`.

Don't relax those without talking to the QA lead first.

## Scripts

```bash
npm run dev               # local dev server
npm run build             # production build
npm run typecheck         # tsc --noEmit
npm run lint              # next lint
npm run e2e               # Playwright suite (needs a browser + Mongo)
npm run smoke-prod <url>  # read-only smoke test against a live deployment

# Unit tests run on the Node built-in runner via tsx (no DB / no browser):
npx tsx --test tests/unit/*.test.ts

# Operator scripts
npm run set-admin <email>            # promote a user to admin
npm run set-password <email> <pw>    # bootstrap a password from CLI
npm run cleanup-users                # drop everyone not from the invite flow
npm run backfill-usernames           # backfill handles on legacy accounts
npm run migrate-roles                # migrate legacy pm/employee role aliases
npm run seed                         # canonical seed
npm run seed:demo                    # demo workspace seed (see Demo data above)
```

## Testing

Two layers, both runnable from a clean checkout:

- **Unit** (`npx tsx --test tests/unit/*.test.ts`) — zero-infra tests on the Node built-in runner via `tsx`. Covers the rule-based triage/quality-signal math (clustering + cosine similarity) and the Flow Signal meaningful-activity engine. No database, no browser.
- **End-to-end** (`npm run e2e`) — Playwright drives auth, dashboard, projects, teams and core UX flows against a real server backed by an in-memory Mongo. See [`docs/E2E.md`](./docs/E2E.md).

CI runs typecheck, lint and the production build on every push (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

## Multi-tenant (dormant)

Pragati ships with a scaffolded master-admin / database-per-tenant runtime, currently inactive. The default deployment runs as a single tenant named `default`. To enable:

1. Set `PRAGATI_MULTI_TENANT=true` in the hosting environment.
2. Provision a fresh Mongo database for the new tenant.
3. Insert the corresponding `tenants` document (slug, dbName, customDomain, plan, quotas).
4. Promote one user to the `master_admin` role.

The `/master-admin` console renders a status board explaining the steps until the runtime is active.


