/**
 * Server-side helper for the admin-only People directory (workspace user
 * management). Mirrors the initial load the /people page did inline, but wraps
 * it in a read-through cache so repeat navigations don't re-run the full user
 * scan + count every time.
 *
 * The directory is identical for every admin (it is NOT viewer-scoped), so a
 * single global cache key serves them all. Any user create / update / delete
 * busts it (see bustPeopleDirectoryCache), and a short TTL bounds staleness if
 * a bust is ever missed. Only the bounded first page of active contributors is
 * cached — search / "load more" still hit the API uncached.
 */
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { u } from '@/lib/serialize';
import { cached, cacheBust } from '@/lib/cache';

// First page size for the unbounded active-contributor set. Kept in the lib so
// the page and the cache agree on exactly what was cached.
export const PEOPLE_CONTRIB_PAGE = 150;

const PEOPLE_DIR_TTL_SECONDS = 20;
const PEOPLE_DIR_CACHE_KEY = 'people:dir';

const LEAD_ROLES = ['lead', 'admin', 'pm'];
const CONTRIB_ROLES = ['contributor', 'employee'];

export interface PeopleDirectoryPayload {
  users:        ReturnType<typeof u>[];
  contribTotal: number;
  contribPage:  number;
}

/**
 * Read-through cached People-directory payload. On a hit it skips the four
 * queries; on a miss (or when the cache is disabled) it computes fresh exactly
 * as the page did before. Transparent when Upstash is not configured.
 */
export async function getPeopleDirectory(): Promise<PeopleDirectoryPayload> {
  return cached(PEOPLE_DIR_CACHE_KEY, PEOPLE_DIR_TTL_SECONDS, async () => {
    await connectDB();
    const [leads, contributors, deactivated, contribTotal] = await Promise.all([
      User.find({ role: { $in: LEAD_ROLES }, active: { $ne: false } }).sort({ name: 1 }).lean(),
      User.find({ role: { $in: CONTRIB_ROLES }, active: { $ne: false } }).sort({ name: 1 }).limit(PEOPLE_CONTRIB_PAGE).lean(),
      User.find({ active: false }).sort({ name: 1 }).lean(),
      User.countDocuments({ role: { $in: CONTRIB_ROLES }, active: { $ne: false } }),
    ]);
    return {
      users: [...leads, ...contributors, ...deactivated].map(u),
      contribTotal,
      contribPage: PEOPLE_CONTRIB_PAGE,
    };
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
