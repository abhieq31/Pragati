/**
 * Database doctor — find (and optionally recover) user accounts that ended up
 * in the wrong database.
 *
 * Background: an earlier revision forced the app to open the `pragati`
 * database regardless of what MONGODB_URI pointed at. If the real accounts
 * were created while the connection actually used a different database (most
 * commonly MongoDB's default `test` database, when the URI had no path), they
 * stop appearing in the app even though they're safe in the cluster.
 *
 * Usage:
 *
 *   # 1. Survey every database on the cluster and count user accounts in each.
 *   npx tsx scripts/db-doctor.ts
 *
 *   # 2. Once you can see which database holds the real users, copy ALL of its
 *   #    collections into the database the app now uses (default: pragati).
 *   #    Dry-run first:
 *   npx tsx scripts/db-doctor.ts --migrate <sourceDb>
 *   #    Then commit:
 *   npx tsx scripts/db-doctor.ts --migrate <sourceDb> --confirm
 *
 * The migration is additive: it inserts documents that don't already exist in
 * the target (matched by _id) and never deletes anything from the source, so
 * it is safe to re-run. Choose the target with MONGODB_DATABASE (defaults to
 * "pragati", matching the app's fallback).
 *
 * Requires MONGODB_URI in the environment (.env, or paste a one-off):
 *   MONGODB_URI='mongodb+srv://…' npx tsx scripts/db-doctor.ts
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const TARGET_DB = process.env.MONGODB_DATABASE?.trim() || 'pragati';
const SYSTEM_DBS = new Set(['admin', 'local', 'config']);

function requireUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      '[doctor] MONGODB_URI is not set. Provide your Atlas connection string, e.g.\n' +
        "  MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/' npx tsx scripts/db-doctor.ts",
    );
    process.exit(1);
  }
  return uri;
}

async function survey(client: MongoClient) {
  const admin = client.db().admin();
  const { databases } = await admin.listDatabases();

  console.log(`\n[doctor] target database the app reads/writes: "${TARGET_DB}"\n`);
  console.log('[doctor] user accounts per database:');

  let foundOther = false;
  for (const { name } of databases) {
    if (SYSTEM_DBS.has(name)) continue;
    const db = client.db(name);
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log(`  ${name.padEnd(24)} (no users collection)`);
      continue;
    }
    const users = db.collection('users');
    const count = await users.countDocuments();
    const sample = await users
      .find({}, { projection: { email: 1, role: 1 } })
      .limit(5)
      .toArray();
    const marker = name === TARGET_DB ? ' ← app uses this' : '';
    if (name !== TARGET_DB && count > 0) foundOther = true;
    console.log(`  ${name.padEnd(24)} ${String(count).padStart(5)} user(s)${marker}`);
    for (const s of sample) console.log(`        · ${(s.email ?? '(no email)').padEnd(34)} ${s.role ?? ''}`);
  }

  if (foundOther) {
    console.log(
      `\n[doctor] Users exist OUTSIDE "${TARGET_DB}". If those are your real accounts, recover them with:\n` +
        `  npx tsx scripts/db-doctor.ts --migrate <thatDbName>            # dry-run\n` +
        `  npx tsx scripts/db-doctor.ts --migrate <thatDbName> --confirm  # apply`,
    );
  } else {
    console.log(`\n[doctor] No user accounts found in any database other than "${TARGET_DB}".`);
  }
}

async function migrate(client: MongoClient, sourceName: string, confirm: boolean) {
  if (sourceName === TARGET_DB) {
    console.error(`[doctor] source and target are both "${TARGET_DB}" — nothing to migrate.`);
    process.exit(1);
  }

  const source = client.db(sourceName);
  const target = client.db(TARGET_DB);
  const collections = await source.listCollections().toArray();

  console.log(
    `\n[doctor] ${confirm ? 'MIGRATING' : 'DRY-RUN'}: "${sourceName}" → "${TARGET_DB}"  ` +
      `(${collections.length} collection(s))\n`,
  );

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    const srcColl = source.collection(name);
    const tgtColl = target.collection(name);
    const docs = await srcColl.find({}).toArray();
    if (docs.length === 0) {
      console.log(`  ${name.padEnd(24)} 0 docs — skipped`);
      continue;
    }

    if (!confirm) {
      // Count how many would be new (not already present in target by _id).
      const ids = docs.map((d) => d._id);
      const existing = await tgtColl.countDocuments({ _id: { $in: ids as any } });
      console.log(`  ${name.padEnd(24)} ${docs.length} docs → ${docs.length - existing} new, ${existing} already present`);
      continue;
    }

    // Additive upsert by _id: insert missing docs, leave existing target docs
    // untouched. Never deletes from the source.
    const ops = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }));
    const res = await tgtColl.bulkWrite(ops, { ordered: false });
    console.log(`  ${name.padEnd(24)} ${docs.length} docs → ${res.upsertedCount} inserted, ${docs.length - res.upsertedCount} already present`);
  }

  if (!confirm) {
    console.log('\n[doctor] dry-run only. Re-run with --confirm to apply.');
  } else {
    console.log(
      `\n[doctor] done. Verify the app's MONGODB_DATABASE is "${TARGET_DB}" (or that MONGODB_URI ends in /${TARGET_DB}), redeploy, and have a real user sign in.`,
    );
  }
}

async function main() {
  const uri = requireUri();
  const migrateIdx = process.argv.indexOf('--migrate');
  const confirm = process.argv.includes('--confirm');

  const client = new MongoClient(uri);
  await client.connect();
  try {
    if (migrateIdx !== -1) {
      const sourceName = process.argv[migrateIdx + 1];
      if (!sourceName || sourceName.startsWith('--')) {
        console.error('[doctor] --migrate requires a source database name, e.g. --migrate test');
        process.exit(1);
      }
      await migrate(client, sourceName, confirm);
    } else {
      await survey(client);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
