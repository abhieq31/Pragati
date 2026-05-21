# Pragati — Quality Informatics Project Manager

> Project & task management built for pharma QA teams. Tracks Deviations, CAPAs, Change Controls, Software Changes and Validation work with GxP compliance built in.

**Live:** https://pragatialm.vercel.app · **Version:** 1.0.0

---

## What it does

Pragati is a purpose-built PM tool for Quality Informatics. Unlike generic project tools, it understands pharma lifecycles, GxP-critical tasks, QA sign-off requirements and regulatory context out of the box.

- **Lifecycle templates** for Deviation, CAPA, Change Control, Software Change, CSV Validation, Audit, Pharmacovigilance, Data Integrity and more
- **GxP-critical task flagging** with QA sign-off tracking on every task
- **Kanban board** (To Do → In Progress → Review → Blocked → Done) with drag-and-drop
- **Operations Hub** — org-wide pulse: project health matrix, people at work, KPI strip
- **Task Triage** — every open task scored for deadline-miss probability with one-click re-assign / extend due / open
- **Trends** — team velocity, momentum, rising stars, stalled projects, team-pulse load levels
- **QA Triage Assistant** — rule-based classifier that scores any quality event by severity and suggests CAPAs (fully auditable, 21 CFR Part 11 traceable)
- **QA Copilot** — conversational helper for KB lookups and regulatory questions
- **Teams** — function-aligned (CSV, Data Integrity, PV, Lab Informatics, Audit, Training); PMs can edit name, lead, members and description inline
- **Excel export** — any project to a meeting-ready workbook (Executive Summary, All Tasks, Blockers & Bottlenecks)
- **Two roles** — **PM** (full access) and **Individual Contributor** (own tasks, projects, triage, copilot)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | MongoDB via Mongoose |
| Auth | JWT + bcrypt + httpOnly cookies |
| Validation | Zod (every API body) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Excel export | ExcelJS |
| LLM (Copilot only) | Google Generative AI / Anthropic SDK |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or use in-memory mode for local dev)

### 1. Clone and install

```bash
git clone https://github.com/abhieq3/MicroMacro.git
cd MicroMacro
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pragati

# Required — generate with: openssl rand -base64 48
JWT_SECRET=your-long-random-secret

# Optional — for local dev without MongoDB Atlas
USE_IN_MEMORY_MONGO=true

# Required for password reset emails
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
APP_URL=https://yourdomain.com

# Optional — enables QA Copilot LLM augmentation
GEMINI_API_KEY=your-google-ai-key
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First login

Registration happens on `/login` (the form switches between sign-in and sign-up). The first account created becomes the **PM (workspace owner)** automatically. After that, self-registration is disabled — all new accounts must be created by a PM via the People page.

### 5. Useful scripts

```bash
npm run dev        # Start dev server on :3000
npm run build      # Production build
npm run start      # Run production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run seed       # Seed demo data (scripts/seed.ts)
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel link
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel --prod
```

The app is a standard Next.js App Router project — zero additional Vercel configuration needed. The included `vercel.json` is intentionally minimal.

---

## Roles

| Feature | PM | Individual Contributor |
|---|:---:|:---:|
| Dashboard (personal tasks + summary) | ✓ | ✓ |
| Projects — view | ✓ | ✓ |
| Projects — create / edit / delete | ✓ | — |
| Tasks — update status | ✓ | ✓ |
| Operations Hub | ✓ | — |
| Task Triage | ✓ | — |
| Trends | ✓ | — |
| Teams — view | ✓ | ✓ |
| Teams — create / edit / manage members | ✓ | — |
| People — manage users & roles | ✓ | — |
| QA Triage Assistant | ✓ | ✓ |
| QA Copilot | ✓ | ✓ |
| Yearly task view | ✓ | ✓ |
| Excel export | ✓ | ✓ |

Destructive project deletion requires the PM's password re-entry (21 CFR Part 11 audit intent).

---

## Project structure

```
src/
├── app/
│   ├── (authed)/              # All authenticated pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── projects/          # List, detail, new
│   │   ├── tasks/[id]/        # Task detail
│   │   ├── org/               # Operations Hub
│   │   ├── risk/              # Task Triage
│   │   ├── insights/          # Trends
│   │   ├── teams/             # Teams (PM-editable)
│   │   ├── people/            # People management (PM)
│   │   ├── triage/            # QA Triage Assistant
│   │   ├── copilot/           # QA Copilot
│   │   ├── yearly/            # Yearly view
│   │   ├── settings/          # User profile, security, notifications
│   │   └── ai/                # Legacy URL redirects (/ai/risk, /ai/triage)
│   ├── api/                   # All API routes
│   │   ├── auth/              # Login, register, password, first-password
│   │   ├── projects/          # CRUD + export + calendar
│   │   ├── tasks/             # CRUD + subtasks + comments + sign-off + effort
│   │   ├── teams/             # CRUD (PM PATCH/DELETE)
│   │   ├── users/             # People management
│   │   ├── ai/                # Triage + risk scoring
│   │   ├── insights/          # Trends analytics
│   │   ├── analytics/         # Operations Hub analytics
│   │   ├── dashboard/         # Personal dashboard payload
│   │   └── me/                # Current-user endpoints
│   └── login/                 # Public login / signup
├── components/
│   ├── AppShell.tsx           # Sidebar, top bar, notifications
│   ├── ui.tsx                 # Shared primitives (Card, Avatar, LifecycleTag, …)
│   ├── CommandPalette.tsx     # ⌘K global search
│   ├── Toast.tsx              # Toast notifications
│   └── Tour.tsx               # Onboarding tour
├── lib/
│   ├── auth.ts                # JWT helpers (requireUser, requireRole)
│   ├── jwt.ts                 # JWT sign/verify
│   ├── password.ts            # bcrypt helpers
│   ├── db.ts                  # MongoDB connection (cached)
│   ├── http.ts                # readBody, handleError
│   ├── validations.ts         # Zod schemas — single source of truth
│   ├── serialize.ts           # Mongoose -> JSON helpers
│   ├── lifecycles.ts          # Pharma lifecycle templates
│   ├── mailer.ts              # Password reset emails
│   ├── ics.ts                 # Calendar (.ics) export
│   ├── naturalDate.ts         # "next monday" date parsing
│   ├── culture.ts             # Workspace culture defaults
│   ├── alp.ts                 # ALP (Account Lifecycle Provisioning) helpers
│   ├── ai/
│   │   ├── triage.ts          # QA event severity classifier (rule-based)
│   │   ├── qaKnowledge.ts     # Curated KB powering triage
│   │   └── risk.ts            # Task risk scoring model
│   └── client/api.ts          # Frontend fetch wrapper
└── models/                    # Mongoose schemas
    ├── User.ts
    ├── Project.ts
    ├── Task.ts
    └── Team.ts
```

---

## QA Triage Assistant

The triage engine is a **rule-based classifier** tuned for pharma QA language. It is fully auditable — every severity point traces to a specific signal in source. No LLM is in the scoring path; this is a hard requirement for 21 CFR Part 11 reproducibility.

**Categories detected**
- Data Integrity (ALCOA+)
- CSV / Computerized System Validation
- Pharmacovigilance / ICSR
- Audit Trail Issues
- Lab Informatics (LIMS, chromatography)
- Training / Competency

**Severity signals include**
patient safety keywords, batch impact, regulatory/inspection exposure, data falsification, shared credentials, audit trail compromise, repeat findings, and more.

CAPA suggestions are drawn from 21 CFR Part 11, ICH Q10, GAMP 5 and ALCOA+ guidance. See [`CLAUDE.md`](./CLAUDE.md) for the architectural guardrails on this engine.

---

## Compliance posture

Pragati is a validated GxP application and is designed against:

- **CSV** (Computerized System Validation) — the system itself
- **GAMP 5** — components categorised by software category (Cat 3 / 4 / 5)
- **21 CFR Part 11** — electronic records & electronic signatures, immutable audit trails, password re-entry on destructive actions
- **ALCOA+** — Attributable, Legible, Contemporaneous, Original, Accurate, plus Complete, Consistent, Enduring, Available

See [`CLAUDE.md`](./CLAUDE.md) for non-negotiable architectural constraints (auth, DB, triage engine, validation boundaries).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `USE_IN_MEMORY_MONGO` | Dev only | Set `true` to skip MongoDB Atlas in local dev |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASS` | For email | SMTP password |
| `APP_URL` | For email | Public URL used in password reset links |
| `GEMINI_API_KEY` | Copilot | Google Generative AI key — used only by Copilot, never by the triage engine |

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development workflow, commit conventions and PR checklist.

---

## License

Private — internal use only.
