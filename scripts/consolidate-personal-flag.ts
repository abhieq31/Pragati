import 'dotenv/config';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import mongoose from 'mongoose';

/**
 * One-time, idempotent backfill that consolidates the duplicate personal-project
 * flags onto a single source of truth: `isPersonal`.
 *
 * History: projects carried BOTH `isPersonal` and `personal` (identical
 * semantics). New code writes only `isPersonal`; this script heals every
 * existing row so the redundant field can be retired:
 *
 *   1. Any row with `personal: true` but `isPersonal` not true → set
 *      `isPersonal: true` (so a private project can never be downgraded to
 *      shared by dropping the legacy field).
 *   2. Unset the `personal` field everywhere (it no longer exists in new docs).
 *
 * Safe to run repeatedly — a second run is a no-op. Run with:
 *   npm run consolidate-personal-flag
 */
async function main() {
  await connectDB();
  const coll = mongoose.connection.collection('projects');

  // 1) Heal: promote isPersonal where only the legacy `personal` flag was set.
  const healed = await coll.updateMany(
    { personal: true, isPersonal: { $ne: true } },
    { $set: { isPersonal: true } },
  );

  // 2) Retire the redundant field on every row that still carries it.
  const unset = await coll.updateMany({ personal: { $exists: true } }, { $unset: { personal: '' } });

  console.log('[consolidate-personal-flag] healed isPersonal on', healed.modifiedCount, 'project(s)');
  console.log('[consolidate-personal-flag] unset legacy `personal` on', unset.modifiedCount, 'project(s)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
