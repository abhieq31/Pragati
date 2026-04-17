import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { Application } from '@/models/Application';
import { LIFECYCLES, type LifecycleKey } from '@/lib/lifecycles';

export const runtime = 'nodejs';

// Minimal first-run demo seed: a generic team, two applications, three projects.
// Non-pharma, non-Alembic — this is what any new admin sees when they want to
// "just see what the tool looks like with data" before they commit.
export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireRole(req, 'admin');
    if (error) return error;
    await connectDB();

    const hash = (pw: string) => bcrypt.hashSync(pw, 10);

    const demoEmails = [
      'demo.alex@example.local',
      'demo.sam@example.local',
      'demo.priya@example.local'
    ];
    const existing = await User.find({ email: { $in: demoEmails } }).lean();
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Demo data already loaded' },
        { status: 409 }
      );
    }

    const people = [
      {
        email: 'demo.alex@example.local',
        name: 'Alex Demo',
        role: 'manager' as const,
        title: 'Team Lead',
        pw: 'demo1234'
      },
      {
        email: 'demo.sam@example.local',
        name: 'Sam Demo',
        role: 'member' as const,
        title: 'Analyst',
        pw: 'demo1234'
      },
      {
        email: 'demo.priya@example.local',
        name: 'Priya Demo',
        role: 'member' as const,
        title: 'Engineer',
        pw: 'demo1234'
      }
    ];
    const users = await Promise.all(
      people.map((p) =>
        User.create({
          email: p.email,
          name: p.name,
          passwordHash: hash(p.pw),
          role: p.role,
          title: p.title
        })
      )
    );
    const U = Object.fromEntries(users.map((u) => [u.email, u]));

    const team = await Team.create({
      name: 'Demo Team',
      description: 'A small demo team with mixed skills.',
      leadId: U['demo.alex@example.local']._id,
      memberIds: users.map((u) => u._id),
      function: 'general'
    });

    const appDefs = [
      {
        key: 'WEB',
        name: 'Company Website',
        vendor: '',
        description: 'Marketing website and landing pages.',
        lifecycle: 'software' as LifecycleKey
      },
      {
        key: 'CRM',
        name: 'Customer CRM',
        vendor: 'HubSpot',
        description: 'Customer relationship management platform.',
        lifecycle: 'simple' as LifecycleKey
      }
    ];
    const apps = await Promise.all(
      appDefs.map((a) =>
        Application.create({
          key: a.key,
          name: a.name,
          vendor: a.vendor,
          description: a.description,
          ownerId: U['demo.alex@example.local']._id,
          memberIds: users.map((u) => u._id),
          defaultLifecycle: a.lifecycle,
          status: 'operational',
          gxp: false
        })
      )
    );

    const iso = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    async function mkProj(opts: {
      name: string;
      lifecycle: LifecycleKey;
      app: any;
      owner: string;
      start: number;
      due: number;
      tasks?: Array<{ title: string; dueOffset: number; assignee: string; done?: boolean }>;
    }) {
      const lc = LIFECYCLES[opts.lifecycle];
      const phases = lc.phases.map((ph, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: ph.name,
        position: i
      }));
      const p = await Project.create({
        code: `${opts.app.key}-${new Date().getFullYear()}-${String(
          (await Project.countDocuments()) + 1
        ).padStart(4, '0')}`,
        name: opts.name,
        description: '',
        lifecycle: opts.lifecycle,
        priority: 'medium',
        applicationId: opts.app._id,
        teamId: team._id,
        ownerId: U[opts.owner]._id,
        startDate: iso(opts.start),
        dueDate: iso(opts.due),
        gxpImpact: 'none',
        status: 'in_progress',
        phases
      });
      if (opts.tasks?.length) {
        for (let i = 0; i < opts.tasks.length; i++) {
          const t = opts.tasks[i];
          const phaseIdx = Math.min(phases.length - 1, Math.floor(i / 2));
          await Task.create({
            projectId: p._id,
            phaseId: phases[phaseIdx]._id,
            title: t.title,
            taskType: 'task',
            gxpCritical: false,
            requiresQaSignoff: false,
            priority: 'medium',
            assigneeId: U[t.assignee]._id,
            dueDate: iso(t.dueOffset),
            status: t.done ? 'done' : 'todo',
            completedAt: t.done ? new Date() : undefined
          });
        }
      }
      return p;
    }

    await mkProj({
      name: 'Website redesign',
      lifecycle: 'software',
      app: apps[0],
      owner: 'demo.alex@example.local',
      start: -20,
      due: 30,
      tasks: [
        { title: 'Kickoff & stakeholder interviews', dueOffset: -15, assignee: 'demo.alex@example.local', done: true },
        { title: 'Design mockups', dueOffset: -5, assignee: 'demo.priya@example.local', done: true },
        { title: 'Build landing page', dueOffset: 7, assignee: 'demo.priya@example.local' },
        { title: 'QA & accessibility sweep', dueOffset: 14, assignee: 'demo.sam@example.local' },
        { title: 'Launch', dueOffset: 28, assignee: 'demo.alex@example.local' }
      ]
    });
    await mkProj({
      name: 'CRM data cleanup',
      lifecycle: 'simple',
      app: apps[1],
      owner: 'demo.alex@example.local',
      start: -10,
      due: 20,
      tasks: [
        { title: 'Export existing contacts', dueOffset: -7, assignee: 'demo.sam@example.local', done: true },
        { title: 'De-duplicate records', dueOffset: 3, assignee: 'demo.sam@example.local' },
        { title: 'Merge campaign tags', dueOffset: 10, assignee: 'demo.priya@example.local' },
        { title: 'Verify with sales team', dueOffset: 18, assignee: 'demo.alex@example.local' }
      ]
    });
    await mkProj({
      name: 'New contact form',
      lifecycle: 'simple',
      app: apps[0],
      owner: 'demo.priya@example.local',
      start: -3,
      due: 10,
      tasks: [
        { title: 'Write copy', dueOffset: 1, assignee: 'demo.alex@example.local' },
        { title: 'Implement form + validation', dueOffset: 5, assignee: 'demo.priya@example.local' },
        { title: 'Hook up to CRM', dueOffset: 8, assignee: 'demo.sam@example.local' }
      ]
    });

    return NextResponse.json({
      ok: true,
      added: { users: users.length, applications: apps.length, projects: 3 }
    });
  } catch (e) {
    return handleError(e);
  }
}
