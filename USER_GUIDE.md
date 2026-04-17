# User guide — QInformX in 5 minutes

This is a quick walkthrough for people who will actually use the tool day to
day. Written for the QI team at Alembic but works for any PM who manages
multiple projects across multiple applications.

## Sign in

Your admin gave you a URL (something like `http://qinformx.internal/`). Open
it in Chrome or Edge, enter the email and password they created for you, and
bookmark the page.

## The five places you'll spend your time

### 1. My Dashboard (`/`)

Every task assigned to you, bucketed by when it's due: **Today**, **This week**,
**Later**, **No due date**.

- The small circle on the left of every task is a **one-click "mark as done"**.
  Press it — the task fades, a friendly toast appears, your "closed today"
  counter bumps. That's it.
- Every task has a small breadcrumb under its title:
  `APPLICATION › PROJECT CODE › Phase` — so you always know what macro
  delivery your micro task belongs to.
- Filter / see all tasks at the top.
- Overdue items are highlighted in red with days-overdue hint.

### 2. My Reportings (`/reportings`) — managers only

For anyone with at least one direct report. One card per person showing:

- how many tasks they have open / overdue / due this week
- how many they've closed in the last 7 days
- their overall completion rate
- any GxP-critical items still open

Click **"Year →"** on any person to see their yearly review (big deliveries,
early completions, extra-effort score).

> **Tip for DGMs:** open this page before Monday standups. Replaces the
> "where is everyone?" Excel sheet completely.

### 3. Applications (`/applications`)

The top-level organising unit. LIMS, MES, TrackWise, Documentum, IDP Logbook,
your web CRM — whatever your team owns.

Click any application to see:

- Progress tiles (overdue / blocked / GxP open / QA-signoff pending)
- **Bottleneck heatmap** — ranks team members by a transparent overload score
  so you can see who's drowning
- Top AI-flagged risk tasks for that application
- All projects under that application sorted by hotspot

### 4. Projects (`/projects`)

Filterable list of every project across teams, lifecycles, applications,
statuses, or free-text search. Export the whole list to CSV with one click
(top right).

**Creating a project is intentionally low-friction:** only a name is required.
Everything else is optional or inherited from the application you pick.

### 5. Yearly View (`/yearly`)

Celebrates what you — or anyone you have permission to view — delivered this
year. Big deliveries, early completions (extra effort), a monthly bar chart,
and an "extra-effort score" summing the days your work was ahead of schedule.

## Keyboard shortcuts

- **Cmd-K** / **Ctrl-K** — global search across tasks, projects, applications,
  teams, and people. The single fastest way to navigate.
- Once the palette is open: **↑ ↓** to navigate, **Enter** to open, **Esc** to
  close.

## Creating work, keeping it light

When you add a project, pick a **lifecycle**:

| Lifecycle | Use when… |
| --- | --- |
| **Simple** (default) | Everyday work. Three phases (Plan → Do → Done), no seeded tasks — you add what you need. |
| **Software Delivery** | General engineering projects — discovery, design, build, test, release. |
| **CSV / GAMP 5** | Computer System Validation (pharma GxP). Seeds the full validation lifecycle. |
| **SOP** | SOP authoring, review, approval, training. |
| **Deviation / CAPA** | Deviation investigations and corrective actions. |
| **Change Control** | Formal change management for GxP systems. |
| **Audit / Inspection** | Internal audits and regulatory inspections. |
| **Data Integrity** | ALCOA+ assessment lifecycle. |
| **Pharmacovigilance** | ICSR case processing (GVP Module VI). |

Pharma templates seed phases **and pre-filled tasks with GxP / QA sign-off flags
already set**. Non-pharma templates seed phases only — add your own tasks.

## AI features (optional — they're just there when you need them)

- **AI Triage** (`/ai/triage`) — paste a deviation, audit finding or data
  integrity issue; the on-prem classifier returns severity, category,
  rationale, suggested CAPA actions, and similar past cases. Explainable, no
  external API.
- **Deadline Risk** (`/ai/risk`) — predicts which open tasks will slip,
  with per-feature contributions. Trained nightly from your own history.

Both live on your server. Your data never leaves the box.

## Your data, always

Everything is yours. Export every project and every task as CSV at any time
from `/projects` or any project's detail page. Backups run every night
automatically. If QInformX ever doesn't serve you anymore, you leave with
all your data in a format any spreadsheet tool can open.
