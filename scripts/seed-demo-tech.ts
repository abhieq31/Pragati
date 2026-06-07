/**
 * Demo seed — TECH/GPU COMPANY THEME — drops a believable, ready-to-screenshot
 * workspace into your existing database, styled like a fictional GPU/AI
 * compute company ("Nexora Silicon") instead of the pharma QA-IT theme used
 * by `seed-demo.ts`. Built for portfolio screen-recordings (e.g. a LinkedIn
 * post) where GPU-driver / AI-platform / data-center project names read more
 * naturally than regulatory ones — while still exercising every lifecycle
 * template, role, and the personal-project privacy lock.
 *
 *   npm run seed:demo:tech
 *
 * Every record this script creates is independently tagged so it never
 * collides with your real data OR with the pharma demo seed:
 *   - user emails:    demo.<first>@nexora.local
 *   - project codes:  NXD-…
 *   - team/project names: prefixed `[DEMO]`
 *
 * The script is idempotent — re-running deletes only its own previously
 * tagged records and recreates them. To remove it cleanly:
 *
 *   npm run seed:demo:tech -- --clean
 *
 * Demo accounts (all share password `Demo@1234`):
 *
 *   demo.lead@nexora.local   — Team Lead / Director (best for screen-recordings)
 *   demo.ic@nexora.local     — Individual Contributor (for IC views)
 *   demo.<first>@nexora.local — 13 supporting users
 *
 * Pass `--with-admin` to also create demo.admin@nexora.local (off by default
 * to avoid double-admin confusion in your real workspace).
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { User } from '../src/models/User';
import { Team } from '../src/models/Team';
import { Project } from '../src/models/Project';
import { Task } from '../src/models/Task';
import { AuditLog } from '../src/models/AuditLog';
import { Notification } from '../src/models/Notification';
import { LIFECYCLES, type LifecycleKey } from '../src/lib/lifecycles';

// ── CLI flags ───────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const CLEAN_ONLY = args.has('--clean');
const WITH_ADMIN = args.has('--with-admin');

if (!process.env.MONGODB_URI) {
  console.error('[seed:demo:tech] MONGODB_URI is not set. Aborting.');
  process.exit(1);
}

// ── Markers — these are how we identify this script's records on re-run /
// cleanup. Deliberately distinct from seed-demo.ts's markers (different email
// domain, different project-code prefix) so the two demo seeds never collide
// or step on each other's cleanup.
const DEMO_EMAIL_RX     = /^demo\..*@nexora\.local$/i;
const DEMO_PROJECT_CODE = /^NXD-/;
const DEMO_PASSWORD     = 'Demo@1234';

const pick = <T>(arr: T[], n: number): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(n, out.length));
};
const one = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const days = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

interface DemoUser {
  email: string; username: string; name: string;
  role: 'admin' | 'lead' | 'contributor';
  title: string; org: string; dept: string; employeeId: string;
  avatarBg?: string; avatarFont?: number;
}

const ORGS = ['GPU Systems Group', 'AI Platforms Group', 'Data Center Group'];

const PEOPLE: DemoUser[] = [
  { email: 'demo.lead@nexora.local',   username: 'demo.lead',   name: 'Maya Chen (Demo)',         role: 'lead',        title: 'Director of Engineering Programs', org: ORGS[0], dept: 'Engineering PMO',     employeeId: 'NXD-1001', avatarBg: '#76B900', avatarFont: 0 },
  { email: 'demo.ic@nexora.local',     username: 'demo.ic',     name: 'Andre Silva (Demo)',       role: 'contributor', title: 'Senior Driver Engineer',          org: ORGS[0], dept: 'Driver Engineering',  employeeId: 'NXD-2001', avatarBg: '#A7E08C' },
  { email: 'demo.wei@nexora.local',    username: 'demo.wei',    name: 'Wei Zhang (Demo)',         role: 'lead',        title: 'GPU Architecture Lead',           org: ORGS[0], dept: 'Architecture',        employeeId: 'NXD-1002', avatarBg: '#0EA5E9', avatarFont: 0 },
  { email: 'demo.sara@nexora.local',   username: 'demo.sara',   name: 'Sara Khan (Demo)',         role: 'lead',        title: 'AI Platform Lead',                org: ORGS[1], dept: 'AI Infrastructure',   employeeId: 'NXD-1003', avatarBg: '#F59E0B', avatarFont: 0 },
  { email: 'demo.liam@nexora.local',   username: 'demo.liam',   name: 'Liam O’Connor (Demo)', role: 'lead',       title: 'Data Center Systems Lead',        org: ORGS[2], dept: 'Data Center Ops',     employeeId: 'NXD-1004', avatarBg: '#7DD3FC', avatarFont: 0 },
  { email: 'demo.priya@nexora.local',  username: 'demo.priya',  name: 'Priya Nair (Demo)',        role: 'contributor', title: 'Driver QA Engineer',              org: ORGS[0], dept: 'Driver Engineering',  employeeId: 'NXD-2002', avatarBg: '#FDBA74' },
  { email: 'demo.jake@nexora.local',   username: 'demo.jake',   name: 'Jake Sullivan (Demo)',     role: 'contributor', title: 'Silicon Validation Engineer',     org: ORGS[0], dept: 'Architecture',        employeeId: 'NXD-2003', avatarBg: '#FDE047' },
  { email: 'demo.yuki@nexora.local',   username: 'demo.yuki',   name: 'Yuki Tanaka (Demo)',       role: 'contributor', title: 'AI Infrastructure Engineer',      org: ORGS[1], dept: 'AI Infrastructure',   employeeId: 'NXD-2004', avatarBg: '#86EFAC' },
  { email: 'demo.omar@nexora.local',   username: 'demo.omar',   name: 'Omar Haddad (Demo)',       role: 'contributor', title: 'Release Engineer',                org: ORGS[0], dept: 'Release Engineering', employeeId: 'NXD-2005', avatarBg: '#C4B5FD' },
  { email: 'demo.elena@nexora.local',  username: 'demo.elena',  name: 'Elena Petrova (Demo)',     role: 'contributor', title: 'Developer Relations Engineer',    org: ORGS[1], dept: 'Developer Relations', employeeId: 'NXD-2006', avatarBg: '#F8BBD9' },
  { email: 'demo.noah@nexora.local',   username: 'demo.noah',   name: 'Noah Williams (Demo)',     role: 'contributor', title: 'Data Center Reliability Engineer',org: ORGS[2], dept: 'Data Center Ops',     employeeId: 'NXD-2007', avatarBg: '#FCA5A5' },
  { email: 'demo.fatima@nexora.local', username: 'demo.fatima', name: 'Fatima Al-Sayed (Demo)',   role: 'contributor', title: 'Performance Engineer',            org: ORGS[0], dept: 'Architecture',        employeeId: 'NXD-2008', avatarBg: '#A7F3D0' },
  { email: 'demo.ravi@nexora.local',   username: 'demo.ravi',   name: 'Ravi Subramaniam (Demo)',  role: 'contributor', title: 'Firmware Engineer',               org: ORGS[2], dept: 'Architecture',        employeeId: 'NXD-2009', avatarBg: '#FBCFE8' },
  { email: 'demo.grace@nexora.local',  username: 'demo.grace',  name: 'Grace Kim (Demo)',         role: 'contributor', title: 'Technical Program Manager',       org: ORGS[1], dept: 'Engineering PMO',     employeeId: 'NXD-2010', avatarBg: '#FED7AA' },
  { email: 'demo.diego@nexora.local',  username: 'demo.diego',  name: 'Diego Fernandez (Demo)',   role: 'contributor', title: 'QA Automation Engineer',          org: ORGS[0], dept: 'Driver Engineering',  employeeId: 'NXD-2011', avatarBg: '#FEF08A' },
];

if (WITH_ADMIN) {
  PEOPLE.push({
    email: 'demo.admin@nexora.local', username: 'demo.admin', name: 'Demo Admin (Demo)',
    role: 'admin', title: 'Workspace Administrator', org: ORGS[0], dept: 'IT',
    employeeId: 'NXD-9001', avatarBg: '#94A3B8', avatarFont: 0,
  });
}

interface ProjectSpec {
  name: string; code: string; lifecycle: LifecycleKey; team: string; owner: string;
  description: string; daysFromNow: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  gxpImpact?: 'none' | 'low' | 'medium' | 'high';
}

const PROJECTS: ProjectSpec[] = [
  { name: '[DEMO] Studio Driver 580 Series — Launch',        code: 'NXD-REL-2026-031', lifecycle: 'software_release',  team: '[DEMO] Driver Engineering',  owner: 'demo.lead@nexora.local',  description: 'Coordinated release of the 580-series GPU driver across Windows, Linux and the Studio channel — packaging, staged rollout, hotfix readiness.', daysFromNow: -4, priority: 'high' },
  { name: '[DEMO] Hopper-Next Architecture Validation',      code: 'NXD-VAL-2026-014', lifecycle: 'validation',        team: '[DEMO] GPU Architecture',    owner: 'demo.wei@nexora.local',   description: 'Silicon-level validation of the next-gen GPU architecture against the performance, power and thermal spec before tape-out sign-off.', daysFromNow: 70, priority: 'critical' },
  { name: '[DEMO] Training Cluster Thermal Incident',        code: 'NXD-INC-2026-009', lifecycle: 'incident_management', team: '[DEMO] Data Center Systems', owner: 'demo.liam@nexora.local',  description: 'P1 incident — rack-level thermal throttling cut AI training throughput by 40%. Root cause, mitigation and post-incident review.', daysFromNow: 9, priority: 'critical' },
  { name: '[DEMO] Compute SDK 13.2 — Sprint 22',             code: 'NXD-AGI-2026-022', lifecycle: 'agile_sprint',      team: '[DEMO] AI Platform',         owner: 'demo.sara@nexora.local',  description: 'Two-week sprint shipping the new tensor-core scheduling APIs and updated profiler tooling for the Compute SDK.', daysFromNow: 6, priority: 'high' },
  { name: '[DEMO] Data Center Firmware Rollout',             code: 'NXD-CC-2026-018',  lifecycle: 'change_control',    team: '[DEMO] Data Center Systems', owner: 'demo.liam@nexora.local',  description: 'Controlled rollout of the new BMC/firmware baseline across the EU and US data-center fleets, with staged canary and rollback plan.', daysFromNow: 38, priority: 'high', gxpImpact: 'medium' },
  { name: '[DEMO] Neural Rendering Research Initiative',     code: 'NXD-RES-2026-007', lifecycle: 'research',          team: '[DEMO] AI Platform',         owner: 'demo.sara@nexora.local',  description: 'Exploratory research into AI-driven neural rendering and denoising for real-time ray tracing — feasibility, prototypes, publication.', daysFromNow: 95, priority: 'medium' },
  { name: '[DEMO] DevCon 2026 — Developer Portal Launch',    code: 'NXD-PRL-2026-004', lifecycle: 'product_launch',    team: '[DEMO] Developer Relations', owner: 'demo.lead@nexora.local',  description: 'Public launch of the redesigned developer portal, sample-app gallery and SDK docs in time for DevCon keynote.', daysFromNow: 26, priority: 'high' },
  { name: '[DEMO] Driver Regression Coverage Audit',         code: 'NXD-AUD-2026-011', lifecycle: 'audit',             team: '[DEMO] Driver Engineering',  owner: 'demo.lead@nexora.local',  description: 'Quarterly audit of automated regression coverage across driver branches — gap analysis and remediation plan.', daysFromNow: 17, priority: 'medium' },
  { name: '[DEMO] New Engineer Onboarding Programme',        code: 'NXD-TRN-2026-002', lifecycle: 'training_program',  team: '[DEMO] Release Engineering', owner: 'demo.sara@nexora.local',  description: 'Structured 6-week onboarding curriculum for new hires across driver, architecture and platform teams.', daysFromNow: 64, priority: 'low' },
  { name: '[DEMO] Power Management Subsystem — Sprint 23',   code: 'NXD-AGI-2026-023', lifecycle: 'agile_sprint',      team: '[DEMO] GPU Architecture',    owner: 'demo.wei@nexora.local',   description: 'Sprint focused on dynamic voltage/frequency scaling improvements for the next silicon revision.', daysFromNow: 13, priority: 'high' },
  { name: '[DEMO] Edge Inference SDK v2.0 — Release',        code: 'NXD-REL-2026-032', lifecycle: 'software_release',  team: '[DEMO] AI Platform',         owner: 'demo.sara@nexora.local',  description: 'Major version release of the edge-inference SDK — quantization toolchain, smaller runtime footprint, new hardware backends.', daysFromNow: 49, priority: 'high' },
  { name: '[DEMO] Liquid-Cooling Vendor Qualification',      code: 'NXD-VQ-2026-006',  lifecycle: 'vendor_qualification', team: '[DEMO] Data Center Systems', owner: 'demo.liam@nexora.local', description: 'Qualification of two new liquid-cooling vendors for next-gen GPU racks — capability assessment, pilot install, sign-off.', daysFromNow: 58, priority: 'medium' },
];

interface TeamSpec { name: string; description: string; function: string; lead: string; members: string[]; }
const TEAMS: TeamSpec[] = [
  { name: '[DEMO] Driver Engineering',  description: 'Builds and ships GPU drivers across desktop, mobile and data-center platforms.', function: 'general',
    lead: 'demo.lead@nexora.local',
    members: ['demo.lead@nexora.local','demo.ic@nexora.local','demo.priya@nexora.local','demo.omar@nexora.local','demo.diego@nexora.local'] },
  { name: '[DEMO] GPU Architecture',    description: 'Designs and validates next-generation GPU silicon.', function: 'general',
    lead: 'demo.wei@nexora.local',
    members: ['demo.wei@nexora.local','demo.jake@nexora.local','demo.ravi@nexora.local','demo.fatima@nexora.local'] },
  { name: '[DEMO] AI Platform',         description: 'Owns the Compute SDK, training infrastructure and inference runtimes.', function: 'general',
    lead: 'demo.sara@nexora.local',
    members: ['demo.sara@nexora.local','demo.yuki@nexora.local','demo.ic@nexora.local','demo.grace@nexora.local'] },
  { name: '[DEMO] Data Center Systems', description: 'Runs and hardens the global GPU data-center fleet.', function: 'general',
    lead: 'demo.liam@nexora.local',
    members: ['demo.liam@nexora.local','demo.noah@nexora.local','demo.fatima@nexora.local','demo.ravi@nexora.local'] },
  { name: '[DEMO] Developer Relations', description: 'Developer portal, SDK docs, sample apps and community programmes.', function: 'general',
    lead: 'demo.lead@nexora.local',
    members: ['demo.lead@nexora.local','demo.elena@nexora.local','demo.grace@nexora.local'] },
  { name: '[DEMO] Release Engineering', description: 'Coordinates cross-team launches, staged rollouts and onboarding.', function: 'general',
    lead: 'demo.sara@nexora.local',
    members: ['demo.sara@nexora.local','demo.omar@nexora.local','demo.diego@nexora.local','demo.ic@nexora.local'] },
];

/** Wipe everything tagged as this script's demo data. Real data — and the
 *  pharma-themed seed-demo.ts data — are identified by the absence of these
 *  markers and are never touched. */
async function cleanDemo() {
  console.log('[seed:demo:tech] removing existing demo records…');

  const demoUsers = await User.find({ email: DEMO_EMAIL_RX }, '_id').lean();
  const demoUserIds = demoUsers.map((u: any) => u._id);

  const demoProjects = await Project.find({ code: DEMO_PROJECT_CODE }, '_id').lean();
  const demoProjectIds = demoProjects.map((p: any) => p._id);

  const [tasksDel, projDel, teamsDel, usersDel, auditDel, notifDel] = await Promise.all([
    Task.deleteMany({ $or: [
      { projectId: { $in: demoProjectIds } },
      { assigneeId: { $in: demoUserIds } },
    ] }),
    Project.deleteMany({ code: DEMO_PROJECT_CODE }),
    Team.deleteMany({ name: { $in: TEAMS.map((t) => t.name) } }),
    User.deleteMany({ email: DEMO_EMAIL_RX }),
    AuditLog.deleteMany({ $or: [
      { actorId: { $in: demoUserIds } },
      { targetId: { $in: [...demoUserIds, ...demoProjectIds].map(String) } },
    ] }),
    Notification.deleteMany({ userId: { $in: demoUserIds } }),
  ]);

  console.log(`[seed:demo:tech] removed: ${usersDel.deletedCount} users, ${teamsDel.deletedCount} teams, ${projDel.deletedCount} projects, ${tasksDel.deletedCount} tasks, ${auditDel.deletedCount} audit rows, ${notifDel.deletedCount} notifications`);
}

async function buildDemo() {
  console.log(`[seed:demo:tech] creating ${PEOPLE.length} demo users…`);
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const userDocs = await User.insertMany(PEOPLE.map((p) => ({
    email: p.email.toLowerCase(),
    username: p.username,
    name: p.name,
    passwordHash: hash,
    role: p.role,
    title: p.title,
    department: p.dept,
    organisation: p.org,
    employeeId: p.employeeId,
    avatarBg: p.avatarBg,
    avatarFont: p.avatarFont ?? 0,
    avatarLetter: p.name.replace(/\s*\(Demo\)\s*/, '').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase(),
    active: true,
  })));
  const usersByEmail = new Map(userDocs.map((u) => [u.email, u]));

  console.log(`[seed:demo:tech] creating ${TEAMS.length} demo teams…`);
  const teamDocs = await Promise.all(TEAMS.map(async (t) => Team.create({
    name: t.name,
    description: t.description,
    function: t.function,
    leadId: usersByEmail.get(t.lead)!._id,
    memberIds: t.members.map((e) => usersByEmail.get(e)?._id).filter(Boolean),
  })));
  const teamByName = new Map(teamDocs.map((t) => [t.name, t]));

  console.log(`[seed:demo:tech] creating ${PROJECTS.length} shared projects + tasks…`);
  for (const spec of PROJECTS) {
    const owner = usersByEmail.get(spec.owner)!;
    const team  = teamByName.get(spec.team)!;
    const lc    = LIFECYCLES[spec.lifecycle];
    const phases = (lc?.phases || []).map((ph, i) => ({ name: ph.name, position: i }));
    const startDate = days(-Math.floor(20 + Math.random() * 40));
    const dueDate   = days(spec.daysFromNow);

    const proj = await Project.create({
      code: spec.code,
      name: spec.name,
      description: spec.description,
      lifecycle: spec.lifecycle,
      status: spec.daysFromNow < 0 ? 'completed' : 'in_progress',
      priority: spec.priority,
      teamId: team._id,
      ownerId: owner._id,
      startDate, dueDate,
      gxpImpact: spec.gxpImpact || 'none',
      phases,
    });

    const pool = ((team as any).memberIds as any[]).filter((m: any) => String(m) !== String(owner._id));
    const tasks: any[] = [];
    let n = 0;
    for (let phIdx = 0; phIdx < phases.length; phIdx++) {
      const phaseTpl = (lc?.phases || [])[phIdx];
      const titles: string[] = ((phaseTpl?.tasks || []) as any[]).map((t: any) => (typeof t === 'string' ? t : t.title));
      for (let i = 0; i < titles.length; i++) {
        const assignee = pool.length ? one(pool) : owner._id;
        const phaseRatio = phIdx / Math.max(1, phases.length - 1);
        let status: string;
        if (phaseRatio < 0.3)      status = Math.random() < 0.85 ? 'done' : 'in_progress';
        else if (phaseRatio < 0.7) status = ['done', 'in_progress', 'in_progress', 'todo', 'review'][Math.floor(Math.random() * 5)];
        else                       status = ['todo', 'todo', 'in_progress', 'blocked'][Math.floor(Math.random() * 4)];

        const tcd = new Date(startDate.getTime() + (phIdx * 14 + i * 2) * 86400000);
        const completedAt = status === 'done' ? new Date(tcd.getTime() - Math.floor(Math.random() * 5) * 86400000) : null;
        tasks.push({
          projectId: proj._id,
          phaseId: (proj.phases as any)[phIdx]?._id,
          title: titles[i],
          description: '',
          assigneeId: assignee,
          status,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          taskType: 'task',
          gxpCritical: false,
          dueDate: tcd,
          ccTcd: tcd,
          ccNo: `${spec.code}-${String(++n).padStart(3, '0')}`,
          completedAt,
          position: n,
        });
      }
    }
    if (tasks.length) await Task.insertMany(tasks);
  }

  // Personal projects on the demo lead + IC — owner-private, so they exercise
  // the personal-project privacy lock and the personal templates without
  // appearing anywhere in the cross-user workspace views.
  console.log('[seed:demo:tech] adding personal projects on the demo lead and IC…');
  const personalOwners = [usersByEmail.get('demo.ic@nexora.local')!, usersByEmail.get('demo.lead@nexora.local')!];
  const personalLifecycles: LifecycleKey[] = ['personal_career', 'personal_study', 'personal_fitness', 'personal_reading', 'personal_side_project'];
  for (const owner of personalOwners) {
    for (const lifecycleKey of pick(personalLifecycles, 3)) {
      const lc = LIFECYCLES[lifecycleKey];
      const phases = (lc?.phases || []).map((ph, i) => ({ name: ph.name, position: i }));
      const proj = await Project.create({
        code: `NXD-PRSN-${owner._id.toString().slice(-4)}-${lifecycleKey.slice(-4)}`,
        name: `[DEMO] ${lc?.label || 'Personal project'}`,
        description: 'Demo personal project — visible only to its owner.',
        lifecycle: lifecycleKey,
        status: 'in_progress',
        priority: 'medium',
        ownerId: owner._id,
        isPersonal: true,
        personal: true,
        startDate: days(-15),
        dueDate: days(45),
        phases,
      });
      const ptasks: any[] = [];
      (lc?.phases || []).forEach((ph, phIdx) => {
        ((ph.tasks || []) as any[]).forEach((t: any, i: number) => {
          ptasks.push({
            projectId: proj._id,
            phaseId: (proj.phases as any)[phIdx]?._id,
            title: typeof t === 'string' ? t : t.title,
            assigneeId: owner._id,
            status: Math.random() < 0.4 ? 'done' : 'todo',
            priority: 'medium',
            dueDate: days(7 + i * 3),
            position: i + phIdx * 10,
            completedAt: Math.random() < 0.4 ? days(-Math.floor(Math.random() * 5)) : null,
          });
        });
      });
      if (ptasks.length) await Task.insertMany(ptasks);
    }
  }

  // A few audit entries so the admin's audit page has content to demo.
  console.log('[seed:demo:tech] seeding a few audit entries…');
  const lead = usersByEmail.get('demo.lead@nexora.local')!;
  await AuditLog.insertMany([
    { action: 'user.update', category: 'user', actorId: lead._id, actorName: lead.name, targetType: 'user', targetId: usersByEmail.get('demo.priya@nexora.local')!._id.toString(), targetLabel: 'Priya Nair (Demo)', summary: 'Updated title, department',
      meta: { changes: { title: { before: 'QA Engineer', after: 'Driver QA Engineer' }, department: { before: 'QA', after: 'Driver Engineering' } }, reason: 'Org realignment — Q3 reorg' }, createdAt: days(-11) },
    { action: 'project.create', category: 'project', actorId: lead._id, actorName: lead.name, targetType: 'project', targetLabel: '[DEMO] Compute SDK 13.2 — Sprint 22', summary: 'Created project', createdAt: days(-7) },
  ]);

  console.log('');
  console.log('  ✓ Demo workspace ready (tech theme — "Nexora Silicon"). Sign in with:');
  console.log('');
  console.log('      demo.lead@nexora.local  — Director / Team Lead (best for screen-recordings)');
  console.log('      demo.ic@nexora.local    — Individual Contributor');
  console.log('      …and 13 supporting users (demo.<first>@nexora.local).');
  console.log('');
  console.log(`      Password (all accounts):  ${DEMO_PASSWORD}`);
  console.log('');
  console.log('  Re-run `npm run seed:demo:tech` any time — it replaces only its own');
  console.log('  tagged records, never touches your real data or the pharma demo seed.');
  console.log('  Wipe demo data with `npm run seed:demo:tech -- --clean`.');
}

async function main() {
  await connectDB();
  await cleanDemo();
  if (!CLEAN_ONLY) await buildDemo();
  else console.log('[seed:demo:tech] --clean only; not creating new demo records.');
}

main()
  .catch((e) => { console.error('[seed:demo:tech] failed:', e); process.exit(1); })
  .finally(() => mongoose.connection.close());
