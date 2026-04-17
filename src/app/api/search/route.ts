import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Project } from '@/models/Project';
import { Application } from '@/models/Application';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({
        tasks: [],
        projects: [],
        applications: [],
        teams: [],
        users: []
      });
    }
    await connectDB();
    const re = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    const [tasks, projects, applications, teams, users] = await Promise.all([
      Task.find({ title: re }).limit(10).select('_id title projectId status').lean(),
      Project.find({ $or: [{ name: re }, { code: re }] })
        .limit(10)
        .select('_id name code lifecycle')
        .lean(),
      Application.find({ $or: [{ name: re }, { key: re }] })
        .limit(10)
        .select('_id name key')
        .lean(),
      Team.find({ name: re }).limit(5).select('_id name').lean(),
      User.find({ $or: [{ name: re }, { email: re }] })
        .limit(5)
        .select('_id name email title')
        .lean()
    ]);
    return NextResponse.json({
      tasks: tasks.map((t: any) => ({
        id: String(t._id),
        title: t.title,
        projectId: String(t.projectId),
        status: t.status
      })),
      projects: projects.map((p: any) => ({
        id: String(p._id),
        name: p.name,
        code: p.code,
        lifecycle: p.lifecycle
      })),
      applications: applications.map((a: any) => ({
        id: String(a._id),
        name: a.name,
        key: a.key
      })),
      teams: teams.map((t: any) => ({ id: String(t._id), name: t.name })),
      users: users.map((u: any) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        title: u.title
      }))
    });
  } catch (e) {
    return handleError(e);
  }
}
