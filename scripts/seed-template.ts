/**
 * Capture a running project's workflow (its phases + task titles) into the
 * reusable Workflow Template library.
 *
 *   npx tsx scripts/seed-template.ts [projectIdOrCodeOrName] [templateName]
 *
 * Defaults are tuned for the original ask: snapshot "BOT for MES User
 * Management" into a template called "Qualification activities" — the save that
 * previously failed on the schema CastError (now fixed). Run it against the DB
 * named in MONGODB_URI; the template becomes available to everyone in the
 * "Custom" group of the New-Project workflow picker.
 *
 * Idempotent: re-running updates the same-named template rather than creating a
 * duplicate.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { WorkflowTemplate } from '@/models/WorkflowTemplate';

const DEFAULT_PROJECT = process.argv[2] || '6a3f904f30e5de9bbff001e0';
const TEMPLATE_NAME = process.argv[3] || 'Qualification activities';

async function findProject(idOrCodeOrName: string) {
  if (mongoose.isValidObjectId(idOrCodeOrName)) {
    const byId = await Project.findById(idOrCodeOrName).lean();
    if (byId) return byId;
  }
  // Fall back to an exact code, then a case-insensitive name match.
  return (
    (await Project.findOne({ code: idOrCodeOrName }).lean()) ||
    (await Project.findOne({ name: new RegExp(`^${idOrCodeOrName}$`, 'i') }).lean())
  );
}

async function main() {
  await connectDB();

  const project: any = await findProject(DEFAULT_PROJECT);
  if (!project) {
    console.error(`No project matched "${DEFAULT_PROJECT}" (tried id, code, then name).`);
    process.exit(1);
  }

  // Build phase order + a name lookup from the project's own phases.
  const phases: any[] = [...(project.phases || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const phaseNameById = new Map<string, string>(phases.map((p) => [String(p._id), p.name]));

  const tasks = await Task.find({ projectId: project._id })
    .select('title phaseId position createdAt')
    .sort({ position: 1, createdAt: 1 })
    .lean();

  // Group task titles under their phase, preserving board order. Tasks with no
  // phase land in a trailing "Other" stage so nothing is dropped.
  const byPhase = new Map<string, string[]>();
  const orphans: string[] = [];
  for (const t of tasks as any[]) {
    const title = (t.title || '').trim();
    if (!title) continue;
    const key = t.phaseId ? String(t.phaseId) : '';
    if (key && phaseNameById.has(key)) {
      (byPhase.get(key) || byPhase.set(key, []).get(key)!).push(title);
    } else {
      orphans.push(title);
    }
  }

  const templatePhases = phases
    .map((p) => ({ name: p.name, tasks: (byPhase.get(String(p._id)) || []).map((title) => ({ title })) }))
    .filter((p) => p.name);
  if (orphans.length) {
    templatePhases.push({ name: 'Other', tasks: orphans.map((title) => ({ title })) });
  }

  const totalTasks = templatePhases.reduce((n, p) => n + p.tasks.length, 0);
  if (totalTasks === 0) {
    console.error(`Project "${project.name}" has no tasks to capture — aborting.`);
    process.exit(1);
  }

  // Attribute the template to the project owner when possible, else any admin.
  const creator =
    (project.ownerId && (await User.findById(project.ownerId).select('name').lean())) ||
    (await User.findOne({ role: { $in: ['admin', 'master_admin'] } }).select('name').lean());
  if (!creator) {
    console.error('No owner or admin user found to attribute the template to — aborting.');
    process.exit(1);
  }

  const payload = {
    name: TEMPLATE_NAME,
    description: `Captured from "${project.name}"${project.code ? ` (${project.code})` : ''}.`,
    createdBy: (creator as any)._id,
    createdByName: (creator as any).name || '',
    phases: templatePhases,
  };

  const existing = await WorkflowTemplate.findOne({ name: TEMPLATE_NAME });
  if (existing) {
    existing.set(payload);
    await existing.save();
    console.log(`Updated existing template "${TEMPLATE_NAME}".`);
  } else {
    await WorkflowTemplate.create(payload);
    console.log(`Created template "${TEMPLATE_NAME}".`);
  }

  console.log(
    `  ${templatePhases.length} stage(s), ${totalTasks} task(s), attributed to ${(creator as any).name}.`,
  );
  for (const p of templatePhases) {
    console.log(`  • ${p.name} — ${p.tasks.map((t) => t.title).join(', ')}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
