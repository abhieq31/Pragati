/**
 * Read-through cache backed by Upstash Redis — via the REST API over plain
 * `fetch`, so it adds NO npm dependency and runs in both Node and Edge.
 *
 * ── Activation ────────────────────────────────────────────────────────────
 * The cache is active ONLY when both env vars are present:
 *   • UPSTASH_REDIS_REST_URL
 *   • UPSTASH_REDIS_REST_TOKEN
 * When either is missing (local dev, or before Upstash is provisioned) every
 * function here is a transparent no-op: `cached()` simply runs the fetcher and
 * returns its result, so behaviour is byte-identical to having no cache. This
 * means shipping this file changes nothing until you set the two env vars.
 *
 * ── What may be cached ────────────────────────────────────────────────────
 * Only NON-RECORD, read-only operational rollups (e.g. the lead dashboard
 * aggregation) with a short TTL. The cache must NEVER hold:
 *   • the deterministic QA triage / severity scoring path (must stay locally
 *     traceable per the compliance rules), or
 *   • audit-trail entries, e-signatures, or any 21 CFR Part 11 record.
 * The source of truth always remains MongoDB; the cache is a disposable,
 * short-lived copy of a derived view.
 *
 * ── Safety ────────────────────────────────────────────────────────────────
 * No function here ever throws or rejects — a cache outage degrades silently
 * to a direct DB read. A tight timeout guards against a slow/unreachable
 * Redis adding latency beyond what the DB query itself would have cost.
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const CACHE_ENABLED = !!(REST_URL && REST_TOKEN);

// Namespace every key so this app never collides with anything else sharing
// the same Upstash database.
const NS = 'pragati:';

// Upper bound on any single Redis round-trip. If Redis is slower than this we
// abandon it and fall through to the DB rather than compounding latency.
const REDIS_TIMEOUT_MS = 350;

/**
 * Run one Redis command via the Upstash REST endpoint. The body is the command
 * as a JSON array, e.g. ['SET', key, value, 'EX', '20']. Returns the parsed
 * `result`, or null on any error/timeout/disabled-cache. Never throws.
 */
async function redisCmd(command: (string | number)[]): Promise<any> {
  if (!CACHE_ENABLED) return null;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS);
  try {
    const res = await fetch(REST_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: controller.signal,
      // Never let Next.js cache the cache-server response itself.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: unknown; error?: string };
    if (json.error) return null;
    return json.result ?? null;
  } catch {
    // Timeout, network error, abort — all treated as "cache unavailable".
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Fetch + JSON-parse a cached value. Returns null on miss or any error. */
export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  const raw = await redisCmd(['GET', NS + key]);
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Store a JSON-serialisable value with a TTL (seconds). Best-effort. */
export async function cacheSetJSON(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redisCmd([
      'SET',
      NS + key,
      JSON.stringify(value),
      'EX',
      String(Math.max(1, Math.floor(ttlSeconds))),
    ]);
  } catch {
    /* best-effort — a failed write just means the next read is a miss */
  }
}

/** Delete one or more cached keys. Use to bust a derived view after a write. */
export async function cacheBust(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  await redisCmd(['DEL', ...keys.map((k) => NS + k)]);
}

/**
 * Read-through cache. Returns the cached value for `key` if present; otherwise
 * runs `fetcher`, stores the result under `key` for `ttlSeconds`, and returns
 * it. If the cache is disabled or unreachable, this is exactly `await fetcher()`
 * with no added behaviour.
 */
export async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  if (CACHE_ENABLED) {
    const hit = await cacheGetJSON<T>(key);
    if (hit !== null) return hit;
  }
  const fresh = await fetcher();
  if (CACHE_ENABLED && fresh !== undefined && fresh !== null) {
    // Fire-and-forget the write so we don't add its latency to the response.
    void cacheSetJSON(key, fresh, ttlSeconds);
  }
  return fresh;
}
