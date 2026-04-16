# QInformX — Quality Informatics PM with AI

**QInformX** is a self-hostable project & task management platform built for the
**Quality Informatics department** of a pharmaceutical company. It handles
pharma-specific lifecycles (CSV / GAMP 5, SOP, Deviation & CAPA, Change
Control, Audit, Data Integrity, Pharmacovigilance) and adds two explainable
on-premise AI features that plug directly into how QA actually works:

1. 🧠 **AI Issue Triage** — classifies a freshly logged deviation / audit
   finding / data integrity issue by severity and category, cites the
   signals that drove the classification, surfaces similar past cases from
   your own corpus, and proposes CAPA actions from a curated pharma playbook.
2. 📈 **ML Deadline-Risk Predictor** — a logistic-style model that learns
   from your historical completions and predicts, for every open task, the
   probability of missing its deadline — with per-feature contributions so
   every prediction is auditable.

Both AI features run **on your own server**, with no external API calls — the
correct bar for a regulated QA environment.

> Stack: **Next.js 14 (App Router) · TypeScript · MongoDB (Mongoose) · Tailwind · Recharts**.
> One Node process serves the UI, the API, and both AI modules.

---

## 🎯 Feature → requirement mapping

| # | Original ask | Where it lives |
| - | --- | --- |
| 1 | Employee whole view of tasks | `My Dashboard` (`/`) — open / overdue / done filters, subtasks list, GxP & QA sign-off badges |
| 2 | Employee-level completion view | Dashboard stats (completion rate, due this week, overdue) + `Yearly View` (monthly chart, big deliveries, extra-effort score) |
| 3 | Customization for quality pharma software life cycles | `/projects/new` offers 9 lifecycle templates — **CSV / GAMP 5**, **SOP**, **Deviation & CAPA**, **Change Control**, **Audit**, **Process/Method Validation**, **Data Integrity (ALCOA+)**, **Pharmacovigilance (ICSR)**, **Generic** — each auto-creates phases and default tasks pre-flagged with GxP-critical, QA sign-off and regulatory refs (21 CFR Part 11, EU Annex 11, ICH Q10, GAMP 5, MHRA DI 2018, GVP Module VI) |
| 4 | Team-wise current progress + micro-tasks | `Teams/:id` → three tabs: **Team progress** (per-project and per-member load), **Micro-tasks** (every open task/subtask across team projects), **Projects** |
| 5 | Higher-level view of sub-tasks team members must complete | Team `Micro-tasks` tab + `Org Overview` for managers (open / overdue / GxP-critical / QA-signoff pending, lifecycle & status pies, team-level bar chart) |
| 6 | Yearly view — big deliveries + micro-tasks done before deadline | `Yearly View` (`/yearly` or `/yearly/:userId`) — monthly bar chart, big-deliveries list, early-completion trophies, and an **extra-effort score** (sum of days saved) |
| ✨ | Add AI/ML features | `AI Triage` (`/ai/triage`) + `Deadline Risk` (`/ai/risk`) |

---

## 🧠 AI features in detail

### 1. AI Issue Triage (`/ai/triage`)

Input: a free-text title + description. Output:

- **Severity** (`minor` / `major` / `critical`) with a numeric score
- **Category** (Data Integrity, CSV, Pharmacovigilance, Audit Trail, Lab
  Informatics, Training, General) — each category has its own curated CAPA
  playbook
- **Rationale** — every feature that fired (e.g. `+4.0 · Regulatory /
  inspection exposure`, `+3.0 · Shared credentials`)
- **Suggested CAPA** — 3 to 5 actions from the category's playbook
- **Similar past cases** — cosine similarity over bag-of-words vectors of
  your stored deviation / CAPA / audit findings / data review tasks

Also embedded directly in the **task detail page** for any task of type
`deviation`, `capa`, `audit_finding`, or `data_review`. Click *Run triage*
and it persists on the task.

Why this design (vs. calling an LLM)? For a regulated function, auditability
beats mystique. Every score is traceable, reproducible, and testable — and it
runs entirely on your server with no data leaving the environment.

### 2. Deadline Risk Predictor (`/ai/risk`)

For each open task, scores the probability of missing the due date using a
logistic-regression-style model whose coefficients are **learned from your
own historical completions**:

- Feature vector: days-until-due, assignee's current open load, assignee's
  historical miss-rate, priority (one-hot), GxP-critical flag, QA-signoff
  flag, project's historical miss-rate, subtask-completion ratio.
- Intercept: the org base miss-rate (logit).
- Priority / GxP / QA-signoff coefficients are fit from the marginal
  miss-rates in your history (shrinks to sensible priors when a bucket has
  fewer than 3 samples).

Output for each task: probability (0–1), label (low / medium / high), the
per-feature contributions, and a contextual recommendation
(*"Little progress and deadline in <5 days — add resources"*, etc.).

The page groups scored tasks into High / Medium / Low buckets and lets the
team lead filter by team or assignee.

---

## 🚀 Quickstart

Requirements: **Node.js 18+** (tested on 22) and **MongoDB** 6+ (local, Atlas,
or via the bundled `docker-compose.yml`).

```bash
# 0) start MongoDB (pick one)
#   a) docker:
docker compose up -d mongo
#   b) or local mongod:
mongod --dbpath ./.mongo-data

# 1) install
npm install

# 2) copy env
cp .env.example .env
# edit .env if your mongo is elsewhere, e.g. mongodb+srv://... for Atlas

# 3) seed demo data (10 users, 3 teams, 6 projects across 6 lifecycles,
#    historic completions for the yearly view + a pre-seeded corpus for
#    AI triage similarity)
npm run seed

# 4) dev server on :3000
npm run dev
```

Open <http://localhost:3000> and sign in with any demo account (shown on the
login screen):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@qinformx.local` | `admin123` |
| Head of Quality Informatics | `priya@qinformx.local` | `priya123` |
| CSV Lead | `rahul@qinformx.local` | `rahul123` |
| Data Integrity Lead | `ananya@qinformx.local` | `ananya123` |
| Pharmacovigilance Lead | `dhruv@qinformx.local` | `dhruv123` |
| QA Analyst | `karan@qinformx.local` | `karan123` |
| PV Case Processor | `arjun@qinformx.local` | `arjun123` |
| CSV Engineer | `vikram@qinformx.local` | `vikram123` |
| Validation Specialist | `meera@qinformx.local` | `meera123` |
| QA Analyst | `neha@qinformx.local` | `neha123` |

### Production build

```bash
npm run build
npm run start
```

### Environment variables

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/qinformx
JWT_SECRET=change-me-in-production
# Fallback for environments without a Mongo instance (dev only)
USE_IN_MEMORY_MONGO=false
```

Using **MongoDB Atlas**? Just set `MONGODB_URI` to your `mongodb+srv://...`
string. Nothing else changes.

---

## 🧬 Pharma lifecycle templates

Each of these is a first-class template in `src/lib/lifecycles.ts`. When you
create a project and pick a lifecycle, the matching phases and default tasks
are created automatically, pre-flagged with GxP-critical and requires-QA-
sign-off where appropriate.

- **Computer System Validation (CSV / GAMP 5)** — Planning · URS/FS/DS · Build · IQ/OQ/PQ · Release · Periodic Review
- **SOP** — Authoring · Review · Approval · Training · Periodic Review
- **Deviation / CAPA** — Identification · RCA · CAPA definition · Execution & Closure
- **Change Control** — Proposal · Impact assessment · Approval · Implementation · Verification
- **Audit / Inspection readiness** — Preparation · Execution · Findings & CAPA · Follow-up
- **Process / Method Validation** — VMP · Protocol · Execution · Report
- **Data Integrity Assessment (ALCOA+)** — Scope & inventory · Control assessment · Gap remediation · Closure
- **Pharmacovigilance Case Processing** — Intake · Triage · Coding & Narrative · QC & Medical Review · Submission
- **Generic**

Adding a new lifecycle is just an entry in `LIFECYCLES` — it becomes
selectable in the UI automatically.

---

## 📡 API at a glance

All routes live under `/api/*` and use JWT cookies (or `Authorization:
Bearer`). Full set:

```
POST   /auth/register          { email, name, password, role?, title? }
POST   /auth/login             { email, password }
POST   /auth/logout
GET    /auth/me

GET    /users
GET    /teams                  (manager/admin/lead create: POST)
GET    /teams/:id              board: /teams/:id/board
POST   /teams/:id/members       DELETE /teams/:id/members/:userId

GET    /lifecycles             GET /lifecycles?key=csv

GET    /projects                 (?teamId=&status=&lifecycle=&q=)
POST   /projects                 (seeds phases + default tasks from template)
GET/PATCH/DELETE /projects/:id

POST   /tasks
GET/PATCH/DELETE /tasks/:id
POST   /tasks/:id/signoff        (lead / manager / admin only)
POST   /tasks/:id/subtasks
PATCH/DELETE /tasks/:id/subtasks/:subId
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
│   ├── app/                       Next.js App Router
│   │   ├── (authed)/              cookie-protected routes
│   │   │   ├── page.tsx           My Dashboard
│   │   │   ├── projects/…         list / detail / new
│   │   │   ├── tasks/[id]/        task detail with AI triage panel
│   │   │   ├── teams/…
│   │   │   ├── yearly/…
│   │   │   ├── org/               manager org overview
│   │   │   └── ai/{triage,risk}/  AI pages
│   │   ├── api/                   API routes
│   │   └── login/
│   ├── components/                AppShell, UI primitives
│   ├── lib/
│   │   ├── db.ts                  Mongoose connect (+ in-mem fallback)
│   │   ├── auth.ts                JWT cookie helpers
│   │   ├── lifecycles.ts          pharma lifecycle templates
│   │   ├── serialize.ts           Mongo doc → JSON
│   │   ├── http.ts                Zod validation + error helpers
│   │   └── ai/
│   │       ├── triage.ts          issue-triage classifier & similarity
│   │       ├── risk.ts            deadline risk scorer + model trainer
│   │       └── riskService.ts     batch scoring across Mongo
│   └── models/                    Mongoose schemas
├── scripts/seed.ts                demo data seeder
├── docker-compose.yml             optional local Mongo
└── README.md
```

---

## 🔒 Notes for production

- Change `JWT_SECRET` in `.env`.
- Put Nginx / Caddy in front for TLS.
- Use MongoDB Atlas or a replica set with daily backups. The DB holds
  auditable QA records, so backup/restore drills are non-negotiable.
- The AI triage model is deterministic; the risk model is re-trained at
  request time from the live database, so no model artefact to version.
- Every AI output ships with its explanation (features + contributions) —
  keep them next to sign-off records.

## 🛣️ What's intentionally not done yet

- Electronic signature (21 CFR Part 11): password re-prompt on sign-off.
- Email / MS-Teams notifications on overdue GxP-critical tasks.
- File attachments on tasks (evidence, protocols).
- Periodic-review scheduler that auto-creates annual review projects.
- Optional LLM-based narrative generation for CAPA write-ups (kept off by
  default to preserve explainability).
