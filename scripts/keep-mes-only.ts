/**
 * Pre-launch cleanup: delete every project (and its tasks) that is NOT owned
 * by the MES team. MES is the only team actively tracking real work in the
 * workspace at launch; every other project on the cluster is seed or test
 * data and would only confuse the real users on day one.
 *
 *   npx tsx scripts/keep-mes-only.ts            # dry-run
 *   npx tsx scripts/keep-mes-only.ts --confirm  # actually delete
 *
 * Identifies the MES team by name match (case-insensitive `mes`). If no team
 * matches, the script aborts loudly — better than wiping the workspace.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';

async function main() {
  const confirm = process.argv.includes('--confirm');

  await connectDB();

  const mes = await Team.findOne({ name: { $regex: /^mes\b/i } }, '_id name').lean();
  if (!mes) {
    console.error(
      '[keep-mes-only] No team whose name starts with "MES" found. Aborting.\n' +
      'Run `npx tsx scripts/seed.ts` or create the MES team in the UI first.',
    );
    process.exit(1);
  }

  const all = await Project.find({}, '_id code name teamId').lean();
  const keep = all.filter(p => String(p.teamId) === String(mes._id));
  const drop = all.filter(p => String(p.teamId) !== String(mes._id));

  console.log(`\n[keep-mes-only] MES team: ${mes.name}  (${mes._id})`);
  console.log(`  surveyed ${all.length} project(s)`);
  console.log(`  keep: ${keep.length}`);
  for (const p of keep) console.log(`    ✓ ${p.code?.padEnd(8) ?? ''}${p.name}`);
  console.log(`  drop: ${drop.length}`);
  for (const p of drop) console.log(`    ✗ ${p.code?.padEnd(8) ?? ''}${p.name}`);

  if (drop.length === 0) {
    console.log('\n[keep-mes-only] nothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (!confirm) {
    console.log('\n[keep-mes-only] dry-run only. Re-run with --confirm to delete.');
    await mongoose.disconnect();
    return;
  }

  const ids = drop.map(p => p._id);
  const taskRes    = await Task.deleteMany({ projectId: { $in: ids } });
  const projectRes = await Project.deleteMany({ _id: { $in: ids } });
  console.log(
    `\n[keep-mes-only] deleted ${projectRes.deletedCount} project(s) ` +
    `and ${taskRes.deletedCount} task(s).`,
  );

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
