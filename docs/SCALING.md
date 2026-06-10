# Scaling Pragati — from one workspace to "billions, if we must"

This is the engineering plan for growing Pragati by ~6 orders of magnitude
without rewriting it. The honest framing first: **you do not build for a
billion users on day one — you build so that nothing you ship today has to be
thrown away on the way there.** This document maps each growth stage, what
breaks at that stage, and the prepared seam that absorbs it.

## Guiding principles (already encoded in the codebase)

1. **Own the objects, rent the channels.** The Daily Brief is a JSON object we
   compute; dashboards, Web Push, email, and the ICS feed are dumb renderers.
   Channels that cost money (email) are capped and optional; channels we own
   (in-app, push, pull-based ICS) carry unlimited scale at zero marginal cost.
2. **Tenant = workspace = natural shard key.** Pharma QA workspaces never need
   cross-tenant joins. The dormant `Tenant` model + `PRAGATI_MULTI_TENANT`
   runtime is the horizontal-scaling answer: a tenant maps to a database, and
   databases map to clusters. Sharding by tenant is a routing decision, not a
   data-model migration.
3. **Read-through cache over read replicas first.** The optional Upstash Redis
   layer (already wired, inert without env vars) absorbs the hot aggregations
   (dashboard, project list, people) long before replica lag becomes a topic.
4. **Everything heavy runs on a beat, not on a request.** The digest/brief/push
   fan-out is a once-daily batch behind a cron with a hard send cap. Batch work
   scales by partitioning the user list, never by holding a request open.
5. **Stateless app tier.** Auth is a signed JWT in a cookie + a single
   indexed session lookup; any number of serverless instances can serve any
   request. There is no sticky state to migrate, ever.

## Stage map

| Stage | Users | What strains | The prepared answer |
| --- | --- | --- | --- |
| 1 (now) | 10–500 | Nothing. | Single Atlas cluster (`bom1` co-located), compound indexes on every hot path, free-tier email under `BREVO_DAILY_CAP`. |
| 2 | 500–5k | Hot dashboard aggregations; email cap. | Turn on Upstash read-through cache (env vars only). Push + ICS become the default channels; email overflow is by design. Daily cron fans out in batches (`limit(1000)` recipient pages → paginate). |
| 3 | 5k–100k | Single DB write volume; cron duration. | Activate multi-tenant runtime: database-per-tenant on shared clusters (the `Tenant` model already carries `dbName`). Split the daily cron by tenant (one invocation per tenant via a fan-out queue — Vercel Queues / QStash / a `tenants` cursor). Move audit log writes to fire-and-forget batched inserts. |
| 4 | 100k–10M | Cluster count; cross-tenant ops; search. | Tenant→cluster routing table (consistent hashing over cluster pool). Read models: nightly-built rollups (per-team throughput, activity heatmaps) instead of on-request aggregation. Add a search service (Atlas Search per cluster) — still no cross-tenant joins needed. |
| 5 | 10M–1B+ | Everything centralized. | Regional cells: a cell = app deployment + cluster pool + cache + cron runner serving a set of tenants, fronted by a tenant→cell directory (the only global component, cached aggressively at the edge). Cells share zero state; global growth = stamping cells. The audit trail ships to per-tenant append-only cold storage (S3/Blob) with the last 90 days hot. |

## Why this works without a rewrite

- **No cross-tenant queries exist today.** Every query is already scoped by
  `leadScope`/tenant. That is THE property that makes cell-based sharding a
  deployment exercise instead of a re-architecture.
- **Mongoose stays.** Database-per-tenant means each connection pool talks to
  one small database; the 25-connection pool config already anticipates
  serverless fan-out. Connection routing slots into `connectDB()` (one file).
- **The brief/digest pipeline is already partition-friendly:** pure builders
  keyed by user, batch caps, per-run summaries persisted for observability,
  and providers behind seams (`MAIL_PROVIDER`, `BREVO_API_URL`) so any tenant
  can bring their own relay at Stage 3+.
- **Web Push has no scale ceiling for us:** browser vendors run the delivery
  infrastructure; our cost is one signed HTTP POST per subscription per day,
  parallelisable and free.

## Cheap hardening already in place (this repo)

- Compound indexes on every hot read path (projects, tasks, users, audit).
- Fail-fast connection settings + cached connection promise reset on failure.
- Daily-send cap + per-run delivery stats surfaced to the admin.
- Capability-token ICS feed (no session work on calendar pollers) with
  client-side poll throttling hints (`X-PUBLISHED-TTL`, `Cache-Control`).
- Dead push subscriptions pruned at send time (no unbounded growth).
- Rate-limit-friendly: heavy fan-out only on the authenticated cron path,
  fail-closed without `CRON_SECRET`.

## What we deliberately do NOT do yet

- No queues, no Kafka, no microservices, no read replicas at Stage 1–2. Every
  one of those adds operational surface that a free-forever product cannot
  afford until the stage demands it.
- No LLM in any scoring/selection path (architectural invariant) — which also
  means the cost curve of the intelligence layer is flat.

The rule for future contributors: **before adding infrastructure, check which
stage we are actually at.** Each stage above is a one-way door we only walk
through when the metrics say so.
