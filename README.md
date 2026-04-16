# QInformX

> A project & task management platform for teams that manage multiple business
> applications — with pharma Quality Informatics built-in and two explainable
> on-premise AI/ML features. Open source. Self-hostable. No external AI APIs.

QInformX was born as an internal replacement for an Excel-based progress
tracker used by a pharma Quality Informatics team (Alembic Pharma). One DGM
was spending hours every week reconciling macro and micro task progress
across LIMS, MES, TrackWise, Documentum and an in-house e-logbook just to
answer the question "where is work stuck and who needs help?".

The tool is **generic enough to use on any multi-application team** and
specialised enough — via pharma QA lifecycle templates and AI triage for
deviations — that regulated quality teams can adopt it without customisation.

---

## ✨ Features

### Applications as the top-level organising unit

Every project is nested under an **Application** (LIMS, MES, TrackWise,
Documentum, IDP Logbook in the seed data; anything you want in real life).
Each application has:

- a **single accountable owner** (the delivery manager / DGM / whatever you
  call the person on the hook for it),
- a **member roster** of people who can be assigned tasks,
- a **default lifecycle** (CSV, Data Integrity, SOP…) so new projects inherit
  sensible pharma defaults, and
- a **bottleneck heatmap** (see below) that ranks members by a transparent
  overload score.

### Bottleneck heatmap per application

The view Satya wanted from day one and Excel could never give him. For the
selected application, shows:

| Signal | Why it matters |
| --- | --- |
| Overdue open tasks | Already late — needs escalation |
| Blocked tasks | External dependency or decision pending |
| GxP-critical open | Regulatory risk if it slips |
| QA sign-off pending | Done but waiting on someone to close |
| AI-flagged risk tasks | Predicted to miss deadline |

Members are ranked by a **transparent bottleneck score**:

```
score = overdue × 4 + blocked × 3 + high-risk × 2 + GxP × 1.5 + open-load × 0.2
```

The formula is printed right on the page — no black-box ranking.

### Macro and micro, personal and team

- **My Dashboard**: every task & subtask in your bucket, with open / overdue /
  done / all filters and due-date countdowns.
- **Team view**: per-member load, per-project progress, and a flat list of
  every open micro-task across the team's projects.
- **Org Overview** (managers): lifecycle & status pies, per-team task volume.
- **Yearly View**: monthly bar chart, big deliveries and *early-completion
  trophies* (the "extra effort" your team put in before the deadline).

### Pharma QA lifecycle templates

Pick one at project creation and the phases and default tasks are seeded for
you, each pre-flagged with GxP-critical / requires-QA-sign-off and tagged with
regulatory references.

- **CSV / GAMP 5** — Planning · URS/FS/DS · Build · IQ/OQ/PQ · Release · Periodic Review
- **SOP** — Authoring · Review · Approval · Training · Periodic Review
- **Deviation / CAPA** — Identification · RCA · CAPA · Execution & Closure
- **Change Control** — Proposal · Impact · Approval · Implementation · Verification
- **Audit / Inspection readiness** — Preparation · Execution · Findings & CAPA · Follow-up
- **Process / Method Validation** — VMP · Protocol · Execution · Report
- **Data Integrity (ALCOA+)** — Scope · Control assessment · Gap remediation · Closure
- **Pharmacovigilance (ICSR)** — Intake · Triage · Coding · QC & Medical · Submission
- **Generic** — for teams that just want tasks-under-phases

Regulatory refs baked in: 21 CFR Part 11, EU Annex 11, GAMP 5, ICH Q10, MHRA DI 2018, GVP Module VI.

### Two AI/ML features that earn their keep

1. **🧠 AI Issue Triage** (`/ai/triage`) — paste a deviation, audit finding
   or data integrity issue; get a severity (minor/major/critical), a category,
   **the exact signals that drove the score**, a short CAPA playbook, and
   similar past cases from your own corpus. Runs as an explainable scored
   classifier on your server — no external LLM call.
2. **📈 Deadline Risk Predictor** (`/ai/risk`) — a logistic-style scorer
   whose coefficients are fit from your own historical completions. For each
   open task it returns a miss-probability, a low/medium/high label, a
   contextual recommendation, and every feature's contribution.

Both run locally; every output is traceable. This is the right bar for
regulated QA, and a healthy one for any team that doesn't want its work
details shipped to someone else's server.

---

## 🎯 How this maps to the original brief

| # | Original ask | Where it lives |
| - | --- | --- |
| 1 | Employee whole view of tasks | `/` My Dashboard |
| 2 | Employee-level task/project completion | Dashboard stats + `/yearly` |
| 3 | Pharma software lifecycle customisation | Lifecycle templates on project creation |
| 4 | Team-wise progress + micro tasks | `/teams/:id` three tabs |
| 5 | Higher-level view of sub-tasks team members must complete | `/applications/:id` bottleneck heatmap + `/org` |
| 6 | Yearly view with big + early-completion tasks | `/yearly` with extra-effort score |
| +  | Organise by business application | **`/applications`** (new, the heart of the tool) |
| +  | Track bottlenecks at a glance | **Application bottleneck heatmap** |
| +  | AI/ML support | **AI Triage + Deadline Risk** |

---

## 🛠 Stack

- **Next.js 14 (App Router) · TypeScript (strict)** — single Node process serves UI, API and both AI modules
- **MongoDB** via Mongoose 8 (Atlas, self-hosted, or docker-compose)
- **Tailwind · Recharts · Lucide**
- **JWT httpOnly cookies**, **bcryptjs**, **Zod** validation

---

## 🚀 Quickstart

```bash
# 0) start Mongo (pick one)
docker compose up -d mongo          # local containerised
# or self-hosted mongod, or MongoDB Atlas -- just set MONGODB_URI

# 1) install
npm install

# 2) env
cp .env.example .env

# 3) seed demo data (5 applications, 7 users mirroring a real QI team, projects
#    with realistic early/late/blocked tasks so the AI models have real signal)
npm run seed

# 4) run
npm run dev     # :3000
```

Sign in with any demo account (one click on the login screen):

| Who | Email | Password |
| --- | --- | --- |
| Satya — DGM · Quality Informatics (the person this tool was built for) | `satya@qinformx.local` | `satya123` |
| Ravi — DGM · LIMS | `lims.dgm@qinformx.local` | `ravi123` |
| Karan — QA Analyst (member) | `karan@qinformx.local` | `karan123` |
| Vikram — CSV Engineer (member) | `vikram@qinformx.local` | `vikram123` |
| Admin | `admin@qinformx.local` | `admin123` |

(There are three more members: Neha, Meera, and a platform admin.)

### Production

```bash
npm run build
npm run start
```

### Environment variables

```
MONGODB_URI=mongodb://127.0.0.1:27017/qinformx
JWT_SECRET=change-me-in-production
USE_IN_MEMORY_MONGO=false
```

For **MongoDB Atlas**, just set `MONGODB_URI=mongodb+srv://…`. Nothing else changes.

---

## 🧱 Data model at a glance

```
Application  ──owns──▶  Project  ──has──▶  Phase
                           │
                           └──has──▶  Task  ──has──▶  Subtask, Comment
                                       │
                                       └── aiTriage? (severity, category, rationale, …)

User  ──is__member/lead_of──▶  Application, Team
Team  ──groups──▶  Project
```

Roles are kept intentionally minimal:

- `member` — sees their own tasks, contributes to projects
- `manager` — creates applications / projects / teams, does QA sign-off, sees org view
- `admin` — user management, deletes applications

Job titles (DGM, CSV Engineer, QA Analyst, …) are captured separately so your
org chart doesn't need to map onto permission levels.

---

## 📡 API reference

```
POST   /auth/register            { email, name, password, role?, title? }
POST   /auth/login               { email, password }
POST   /auth/logout
GET    /auth/me

GET    /users
GET    /teams                    (POST: manager/admin)
GET    /teams/:id                /teams/:id/board, /teams/:id/members

GET    /applications             (POST: manager/admin)
GET    /applications/:id         PATCH/DELETE
POST   /applications/:id/members
DELETE /applications/:id/members/:userId
GET    /applications/:id/bottlenecks

GET    /lifecycles               (?key=csv)

GET    /projects                 (?applicationId=&teamId=&lifecycle=&status=&q=)
POST   /projects                 seeds phases + default tasks from template
GET    /projects/:id             PATCH/DELETE

POST   /tasks
GET    /tasks/:id                PATCH/DELETE
POST   /tasks/:id/signoff        (manager/admin)
POST   /tasks/:id/subtasks
PATCH  /tasks/:id/subtasks/:subId   DELETE
POST   /tasks/:id/comments

GET    /me/tasks
GET    /me/summary
GET    /analytics/user/:id/year?year=YYYY
GET    /analytics/team/:id/progress
GET    /analytics/org/overview

POST   /ai/triage                { title, description, taskId?, save? }
GET    /ai/risk                  (?teamId=&userId=)
```

---

## 🗂️ Project layout

```
.
├── src/
│   ├── app/
│   │   ├── (authed)/                     cookie-protected routes
│   │   │   ├── page.tsx                  My Dashboard
│   │   │   ├── applications/…            list + detail (bottleneck heatmap)
│   │   │   ├── projects/…
│   │   │   ├── tasks/[id]/               with embedded AI triage panel
│   │   │   ├── teams/…
│   │   │   ├── yearly/…
│   │   │   ├── org/                      manager overview
│   │   │   └── ai/{triage,risk}/
│   │   ├── api/                          route handlers
│   │   └── login/
│   ├── components/                       AppShell, UI primitives
│   ├── lib/
│   │   ├── db.ts                         Mongoose connect (+ in-mem fallback)
│   │   ├── auth.ts                       JWT cookie helpers
│   │   ├── lifecycles.ts                 9 pharma-ready lifecycle templates
│   │   ├── serialize.ts                  Mongo → JSON
│   │   ├── http.ts                       Zod + error helpers
│   │   └── ai/
│   │       ├── triage.ts
│   │       ├── risk.ts
│   │       └── riskService.ts
│   └── models/                           User · Team · Application · Project · Task
├── scripts/seed.ts
├── docker-compose.yml
├── LICENSE                               MIT
├── CONTRIBUTING.md
└── README.md
```

---

## 🛣️ Roadmap (contributions welcome)

- 21 CFR Part 11 electronic signature (password re-prompt on sign-off)
- Email / MS Teams notifications for overdue GxP-critical items
- File attachments per task (evidence, validation protocols)
- Periodic review scheduler (auto-create annual SOP / CSV review projects)
- Supabase driver alongside MongoDB (one of the original deployment options)
- Jira / ServiceNow import so teams can onboard without losing history
- Optional LLM-based CAPA narrative drafting (off by default to preserve explainability)

Pull requests welcome — see `CONTRIBUTING.md`.

---

## 📜 License

MIT. See `LICENSE`.
