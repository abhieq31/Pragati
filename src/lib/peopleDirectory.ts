/**
 * Server-side helper for the admin-only People directory (workspace user
 * management). Wraps the page's full-list user load in a read-through cache so
 * repeat navigations don't re-run the scan every time.
 *
 * The directory is identical for every admin (it is NOT viewer-scoped), so a
 * single global cache key serves them all. Any user create / update / delete
 * (and self-profile edit) busts it via bustPeopleDirectoryCache, and a short
 * TTL bounds staleness if a bust is ever missed. The shape returned is exactly
 * what the page passed before — `User.find({}).sort({ name: 1 })` serialised
 * with `u` — so behaviour is unchanged; only the source (cache vs DB) differs.
 */
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { u } from '@/lib/serialize';
import { cached, cacheBust } from '@/lib/cache';

const PEOPLE_DIR_TTL_SECONDS = 20;
const PEOPLE_DIR_CACHE_KEY = 'people:dir';

/**
 * Read-through cached People-directory list. On a hit it skips the user scan;
 * on a miss (or when the cache is disabled) it computes fresh exactly as the
 * page did before. Transparent when Upstash is not configured.
 */
export async function getPeopleDirectory(): Promise<ReturnType<typeof u>[]> {
  return cached(PEOPLE_DIR_CACHE_KEY, PEOPLE_DIR_TTL_SECONDS, async () => {
    await connectDB();
    const users = await User.find({}).sort({ name: 1 }).lean();
    return users.map(u);
  });
}

/**
 * Bust the cached People directory after any user mutation (create, role/
 * profile/active change, delete). The directory is global, so one bust clears
 * it for every admin. Safe to call when the cache is disabled — it no-ops.
 */
export async function bustPeopleDirectoryCache(): Promise<void> {
  await cacheBust(PEOPLE_DIR_CACHE_KEY);
}
