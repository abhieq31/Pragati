# Pragati — Quality Informatics Platform

These are immutable system instructions for any AI or developer working in this
repository. They encode regulatory, architectural, and domain constraints that
MUST be respected. Do not relax, route around, or "modernise" past any of them
without explicit written approval from the QA lead.

## Compliance & Intelligence

- The **QA Triage Assistant** (`src/lib/ai/triage.ts`) and the curated
  **Knowledge Base** (`src/lib/ai/qaKnowledge.ts`) are deterministic,
  rule-based engines. They exist specifically because GxP audits require
  every classification, severity score, and recommended CAPA to be
  reproducible and locally traceable from source.
- **Never** replace the core classification logic in `triage.ts` or
  `qaKnowledge.ts` with an external LLM API call (Gemini, Claude, OpenAI, etc.).
  LLMs may *augment* explanatory text (e.g. the conversational Copilot), but the
  scoring path that produces `severity`, `severityScore`, `category`, and
  `suggestedCapa` must remain rule-based and unit-testable.
- Severity scoring must remain **locally traceable** — a reviewer must be able
  to point at a line of code or a KB entry to justify any score the system
  emitted, without depending on a model checkpoint that may have changed.

## Authentication

- Maintain the existing custom **JWT + bcrypt + httpOnly cookie** implementation
  (see `src/lib/auth.ts`, `src/lib/jwt.ts`, `src/lib/password.ts`).
- **Never** install or migrate to NextAuth, Clerk, Auth0, Supabase Auth, or any
  other generic third-party identity provider. The current design keeps user
  identity, audit trails, and session control fully under our infrastructure,
  which is a requirement for 21 CFR Part 11 §11.10(d) (limiting system access
  to authorised individuals).

## Database

- The application uses **MongoDB via Mongoose**. All persistence layers route
  through `src/models/*.ts` and the singleton `connectDB()` in `src/lib/db.ts`.
- **Do not** migrate to Prisma, Drizzle, TypeORM, Kysely, or any other ORM /
  query builder.
- Serverless API routes must reuse the cached Mongoose connection (see
  `connectDB()` — it caches the promise on `global` so we don't open a new pool
  per cold start). When adding new routes, always call `await connectDB()`
  before any model access.

## Domain Context — Quality Informatics

This is a **QA IT / Quality Informatics** application for the pharmaceutical
sector. Every feature must be designed and reviewed against:

- **CSV** (Computerized System Validation) — the system itself is a validated
  GxP application. Changes that affect calculation, classification, audit
  trails, or e-signatures must consider validation impact.
- **GAMP 5** — categorise components by software category (Cat 3 / 4 / 5),
  prefer configuration over custom code, and document risk.
- **21 CFR Part 11** — electronic records and electronic signatures rules.
  Anything that creates, modifies, or signs a GxP record must produce an
  immutable audit trail (who, what, when, before/after, reason).
- **ALCOA+** data integrity principles — data must be Attributable, Legible,
  Contemporaneous, Original, Accurate, plus Complete, Consistent, Enduring,
  Available.

When introducing a new task type, status, severity, or schema field, explicitly
state how it satisfies these principles. When in doubt, ask the QA lead before
shipping.

## API Boundaries

All API request bodies that touch persistent records MUST be validated through
the central Zod schemas in `src/lib/validations.ts` before reaching the Mongoose
model. Informatics-specific fields (`ccNo`, `deployStage`, `applicableSite`,
`gxpCritical`, `requiresQaSignoff`) must remain explicit in those schemas and
must not be loosened to `z.any()` or `passthrough`.
