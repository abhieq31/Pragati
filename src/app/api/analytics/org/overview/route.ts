import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

function calcHealth(done: number, total: number, overdue: number): 'good' | 'at_risk' | 'critical' {
  if (overdue === 0) return 'good';
  if (total === 0) return 'good';
  return overdue / total > 0.3 ? 'critical' : 'at_risk';
}

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);

    const [
      totalUsers, totalTeams, totalProjects,
      activeProjects, tasksOpen, tasksOverdue,
      gxpCriticalOpen, qaSignoffPending, doneThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ status: { $ne: 'done' } }),
      Task.countDocuments({ status: { $ne: 'done' }, dueDate: { $ne: null, $lt: now } }),
      Task.countDocuments({ status: { $ne: 'done' }, gxpCritical: true }),
      Task.countDocuments({ requiresQaSignoff: true, qaSignoffAt: null, status: 'done' }),
      Task.countDocuments({ status: 'done', completedAt: { $gte: startOfMonth } }),
    ]);

    // Per-project matrix
    const allProjects = await Project.find({ status: { $ne: 'cancelled' } })
      .sort({ status: 1, updatedAt: -1 }).lean();
    const teamDocs = await Team.find({}).lean();
    const teamMap: Record<string, string> = {};
    for (const t of teamDocs) teamMap[String(t._id)] = t.name;

    const projects = await Promise.all(allProjects.map(async (p) => {
      const pid = p._id;
      const [taskCount, tasksDone, tasksOv, lastTask] = await Promise.all([
        Task.countDocuments({ projectId: pid }),
        Task.countDocuments({ projectId: pid, status: 'done' }),
        Task.countDocuments({ projectId: pid, status: { $ne: 'done' }, dueDate: { $lt: now } }),
        Task.findOne({ projectId: pid }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
      ]);
      const lastActivity: Date = (lastTask as any)?.updatedAt ?? p.updatedAt;
      return {
        id: String(pid), name: p.name, code: p.code || '',
        status: p.status, lifecycle: p.lifecycle, dueDate: p.dueDate,
        teamName: teamMap[String(p.teamId)] || 'Unassigned',
        taskCount, tasksDone, tasksOverdue: tasksOv,
        health: calcHealth(tasksDone, taskCount, tasksOv),
        noActivity: lastActivity < threeDaysAgo && p.status === 'in_progress',
        lastActivity,
      };
    }));

    // Per-person workload
    const allUsers = await User.find({}).sort({ name: 1 }).lean();
    const people = await Promise.all(allUsers.map(async (u) => {
      const uid = u._id;
      const [openTasks, overdueTasks, doneThisWeek] = await Promise.all([
        Task.countDocuments({ assigneeId: uid, status: { $ne: 'done' } }),
        Task.countDocuments({ assigneeId: uid, status: { $ne: 'done' }, dueDate: { $lt: now } }),
        Task.countDocuments({ assigneeId: uid, status: 'done', completedAt: { $gte: sevenDaysAgo } }),
      ]);
      return { id: String(uid), name: u.name, title: u.title || '', role: u.role, openTasks, overdueTasks, doneThisWeek };
    }));

    // Needs-attention feed
    const attention: { severity: 'critical' | 'warn'; label: string; detail: string; href: string }[] = [];
    for (const p of projects) {
      if (p.tasksOverdue > 0) attention.push({ severity: p.tasksOverdue >= 3 ? 'critical' : 'warn', label: p.code || p.name, detail: `${p.tasksOverdue} task${p.tasksOverdue > 1 ? 's' : ''} overdue`, href: `/projects/${p.id}` });
      if (p.noActivity) attention.push({ severity: 'warn', label: p.code || p.name, detail: 'No activity in 3+ days', href: `/projects/${p.id}` });
    }
    if (gxpCriticalOpen)  attention.push({ severity: 'critical', label: 'GxP Critical', detail: `${gxpCriticalOpen} open GxP-critical task${gxpCriticalOpen > 1 ? 's' : ''}`, href: '/projects' });
    if (qaSignoffPending) attention.push({ severity: 'warn', label: 'QA Sign-off', detail: `${qaSignoffPending} task${qaSignoffPending > 1 ? 's' : ''} awaiting sign-off`, href: '/projects' });
    attention.sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1));

    return NextResponse.json({
      totals: {
        users: totalUsers, teams: totalTeams, projects: totalProjects, activeProjects,
        tasksOpen, tasksOverdue, gxpCriticalOpen, qaSignoffPending, doneThisMonth,
        overallHealth: tasksOpen ? Math.round(((tasksOpen - tasksOverdue) / tasksOpen) * 100) : 100,
      },
      projects,
      people,
      attention,
    });
  } catch (e) {
    return handleError(e);
  }
}
