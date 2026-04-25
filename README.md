# QInformX

**A self-hosted project & task management platform for quality-driven teams.**

Built for pharmaceutical Quality Informatics, but designed to be forked by any team that takes quality seriously — regulated or not.

> Stack: **Next.js 14 (App Router) · TypeScript · MongoDB · Tailwind CSS · Recharts**
> One Node process. No paid AI APIs. No cloud lock-in.

---

## Why this exists

Most PM tools are built for software teams. They do not understand GxP, CAPA, validation lifecycles, or the difference between a deviation and a change control. They do not understand that "done" in pharma means signed off, not just checked.

QInformX was built by a Quality Informatics team who needed a tool that spoke their language — and felt personal enough that people would actually use it.

It ships with:

- **Macro + micro visibility** — project-level progress built from every subtask, with nothing falling through the cracks
- **Pharma lifecycle templates** — CSV/GAMP 5, SOP, Deviation/CAPA, Change Control, Audit, Validation, Data Integrity (ALCOA+), Pharmacovigilance
- **Joyful employee experience** — celebration animations, quick-add in three taps, recent wins, streaks
- **Two roles, no bureaucracy** — `employee` sees their bucket; `pm` sees the whole team
- **On-premise AI** — issue triage (severity + CAPA playbook) and deadline risk predictor, both fully explainable, no data leaving your server
- **Amazon Leadership Principles woven in** — not as wallpaper, but as daily reflections, empty-state nudges, and achievement framing
- **Cultural layer** — greetings in Gujarati and Hindi, pharma-pride copy, quality-leader quotes

---

## Philosophy

### Amazon Leadership Principles as operating system

The 16 Amazon Leadership Principles are embedded across the app — not as motivational posters, but as a daily operating framework:

| Where you see them | How they show up |
| --- | --- |
| Dashboard widget | One principle surfaces each day, with a QI-specific interpretation |
| Task completion | The matching principle labels your win (e.g., completing a GxP task early = "Bias for Action · Insist on the Highest Standards") |
| Empty states | Each uses the most relevant principle's own language as a nudge |
| Overdue warnings | The relevant principle reminds you why closing this loop matters |
| Quick-add | "Bias for Action — start it now" |

The goal is not inspiration. The goal is that, over time, the principles become the team's shared vocabulary for quality work.

### Open source as a quality practice

This tool is open source for the same reason QA documentation is open to auditors: **transparency earns trust**. Anyone can read the code, fork it, audit the AI models, and verify that nothing leaves their environment.

The AI features are deliberately simple and explainable — logistic-style scorers with per-feature contributions — because in a regulated environment, "the model said so" is not an acceptable justification. Every score is reproducible. Every weight can be inspected.

### The personal layer

A PM tool that feels institutional will be used institutionally — reluctantly, minimally. QInformX tries to feel like it was made by the team, for the team:

- It greets you in Gujarati on Mondays and Fridays if your name suggests you might appreciate it
- It says "Shabash!" when you close a task early, "Wah-wah!" for GxP completions
- It quotes W. Edwards Deming and MHRA guidance alongside each other, because both are part of the culture
- The progress bar says "In Specification ✓" at 90%
- Completed wins close with "Touching Lives · over 100 Years"

These are small. They compound.

---

## Quickstart

**Requirements:** Node.js 18+ and MongoDB 6+ (local, Atlas, or Docker)

```bash
# Option A — Docker (easiest)
docker compose up -d mongo

# Option B — local mongod
mongod --dbpath ./.mongo-data

# Install dependencies
npm install

# Copy env and configure
cp .env.example .env
# Edit MONGODB_URI and JWT_SECRET

# Development server (auto-seeds demo data on first run)
npm run dev
```

Open `http://localhost:3000`.

On first run with `USE_IN_MEMORY_MONGO=true`, the app seeds a demo QI team automatically — no manual seed step needed. The demo team includes a PM account and employee accounts; credentials are printed to the server console on first boot.

### Environment variables

```bash
# Required in production
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/qinformx
JWT_SECRET=<long-random-string>   # openssl rand -base64 48

# Development only — in-memory MongoDB with auto-seed
USE_IN_MEMORY_MONGO=true
```

### Production build

```bash
npm run build
npm run start
```

Deploys cleanly to **Vercel** (push to GitHub, import project, set env vars). Also runs on any Node host behind Nginx/Caddy for TLS.

---

## Feature map

| Feature | Path | Who sees it |
| --- | --- | --- |
| My Dashboard | `/` | All |
| Projects list + detail | `/projects` | All |
| My Year (yearly view) | `/yearly` | All |
| Teams list + board | `/teams` | PM |
| Org Overview | `/org` | PM |
| Team Yearly View | `/yearly/:userId` | PM |
| AI Issue Triage | `/ai/triage` | PM |
| Deadline Risk | `/ai/risk` | PM |

---

## Pharma lifecycle templates

Each template is a first-class entry in `src/lib/lifecycles.ts`. Creating a project from a template auto-creates phases and default tasks, pre-flagged with GxP-critical and QA-sign-off requirements where appropriate.

| Template | Lifecycle key | Regulatory reference |
| --- | --- | --- |
| Computer System Validation (CSV / GAMP 5) | `csv` | GAMP 5, EU Annex 11, 21 CFR Part 11 |
| Standard Operating Procedure | `sop` | ICH Q10, EU GMP Chapter 4 |
| Deviation & CAPA | `deviation_capa` | ICH Q10, 21 CFR 211.192 |
| Change Control | `change_control` | ICH Q10, EU Annex 15 |
| Audit / Inspection Readiness | `audit` | ICH Q10 |
| Process / Method Validation | `validation` | ICH Q2(R1), EU Annex 15 |
| Data Integrity Assessment (ALCOA+) | `data_integrity` | MHRA DI 2018, WHO TRS 996 |
| Pharmacovigilance Case Processing | `pharmacovigilance` | GVP Module VI, ICH E2A |
| Generic | `generic` | — |

Adding a new lifecycle: add an entry to `LIFECYCLES` in `src/lib/lifecycles.ts` and it becomes selectable in the UI automatically.

---

## AI features

### Issue Triage (`POST /ai/triage`)

Input: free-text title + description. Output:

- **Severity** (`minor` / `major` / `critical`) with a numeric confidence score
- **Category** — Data Integrity, CSV, Pharmacovigilance, Audit Trail, Lab Informatics, Training, General — each with its own curated CAPA playbook
- **Rationale** — every feature that fired (e.g. `+4.0 · Regulatory/inspection exposure`)
- **Suggested CAPA actions** — 3–5 from the category's playbook
- **Similar past cases** — cosine similarity over bag-of-words vectors of your stored deviations/findings

Why not an LLM? Because "the model said so" is not auditable. Every score here is deterministic, reproducible, and inspectable. No data leaves your server.

### Deadline Risk (`GET /ai/risk`)

For each open task, scores the probability of missing the due date using logistic-regression-style scoring:

- Feature vector: days-until-due, assignee's open load, assignee's historical miss-rate, priority, GxP flag, QA-sign-off flag, project's historical miss-rate, subtask completion ratio
- Coefficients learned from your own historical completions
- Output: probability (0–1), label (low/medium/high), per-feature contributions, contextual recommendation

Every prediction ships with its full explanation — keep them next to sign-off records.

---

## Project structure

```
src/
├── app/
│   ├── (authed)/          Cookie-protected pages
│   │   ├── page.tsx       My Dashboard (ALP principle, cultural greetings, quick-add)
│   │   ├── projects/      List, detail, new (lifecycle templates)
│   │   ├── tasks/[id]/    Task detail with AI triage panel
│   │   ├── teams/         Team board, member management
│   │   ├── yearly/        Monthly chart, big deliveries, early-completion trophies
│   │   ├── org/           PM org overview
│   │   └── ai/            Triage + deadline risk pages
│   ├── api/               All API routes (JWT-protected)
│   └── login/             Auth page
├── components/
│   ├── AppShell.tsx       Sidebar + nav
│   └── ui.tsx             Shared primitives (Card, Tag, ProgressBar, Avatar…)
├── lib/
│   ├── db.ts              Mongoose connect (with in-memory fallback)
│   ├── auth.ts            JWT cookie helpers
│   ├── lifecycles.ts      Pharma lifecycle templates
│   ├── alp.ts             Amazon Leadership Principles data + daily rotation
│   ├── culture.ts         Greetings, seasonal copy, pharma-pride phrases
│   ├── serialize.ts       Mongo doc → JSON
│   ├── http.ts            Zod validation + error helpers
│   └── ai/
│       ├── triage.ts      Issue-triage classifier + similarity
│       ├── risk.ts        Deadline risk scorer + model trainer
│       └── riskService.ts Batch scoring
└── models/                Mongoose schemas (User, Project, Task, Team)
```

---

## API reference

All routes are under `/api/*`. Auth uses JWT in an httpOnly cookie (7-day). Pass `Authorization: Bearer <token>` for non-browser clients.

```
POST   /auth/register        { email, name, password, title? }
POST   /auth/login           { email, password }
POST   /auth/logout
GET    /auth/me

GET    /users
GET/POST /teams
GET    /teams/:id
POST   /teams/:id/members
DELETE /teams/:id/members/:userId
GET    /teams/:id/board

GET    /lifecycles
GET/POST /projects
GET/PATCH/DELETE /projects/:id

POST   /tasks
GET/PATCH/DELETE /tasks/:id
POST   /tasks/:id/signoff
POST/GET /tasks/:id/subtasks
PATCH/DELETE /tasks/:id/subtasks/:subId
POST   /tasks/:id/comments

GET    /me/tasks
GET    /me/summary
GET    /analytics/user/:id/year?year=YYYY
GET    /analytics/team/:id/progress
GET    /analytics/org/overview
GET    /api/health

POST   /ai/triage            { title, description, taskId?, save? }
GET    /ai/risk              ?teamId=&userId=
```

---

## Roles

| Role | What they see |
| --- | --- |
| `employee` | My Dashboard, Projects (read), My Year |
| `pm` | Everything above + Teams, Org Overview, Yearly View for all users, AI features |

First user to register becomes PM. Everyone else registers as employee.

---

## Production checklist

- [ ] Set `MONGODB_URI` to a replica set or Atlas M10+ with daily backups (M0 works for small teams)
- [ ] Set `JWT_SECRET` to a 48+ byte random string (`openssl rand -base64 48`)
- [ ] Remove `USE_IN_MEMORY_MONGO` from env
- [ ] Put the app behind TLS (Nginx, Caddy, or Vercel handles this automatically)
- [ ] Set up MongoDB Atlas alerts for disk/connection limits
- [ ] Review `src/lib/devSeed.ts` — it only runs when `USE_IN_MEMORY_MONGO=true`, so it is safe in production

---

## Roadmap / what's not done yet

- Electronic signature (21 CFR Part 11 re-prompt on sign-off)
- Email / Teams notifications for overdue GxP-critical tasks
- File attachments on tasks (evidence, protocols, test reports)
- Periodic-review scheduler (auto-creates annual review projects)
- Mobile-responsive layout (currently desktop-first)
- Multi-language full localisation (Gujarati / Hindi UI strings)
- Optional LLM narrative generation for CAPA write-ups (kept off by default to preserve explainability)

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up a development environment, the branching model, and the PR checklist.

The short version: fork → feature branch → test → PR with a description that explains *why*, not just what.

---

## License

[MIT](LICENSE) — fork it, use it, build on it. If you make it better, consider opening a PR.

---

<div align="center">
  <sub>Built with care by the Quality Informatics team · <em>Touching Lives over 100 Years</em></sub>
</div>
