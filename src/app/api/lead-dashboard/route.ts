import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { project as projectS, task as taskS } from '@/lib/serialize';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

const STATUS_ORDER: Record<string, number> = { in_progress: 0, review: 1, blocked: 2, todo: 3, done: 4 };

// Single endpoint that backs the entire lead dashboard. Replaces three
// separate calls (/api/dashboard + /api/insights + /api/projects) with one
// round trip and one cached Mongoose connect.
//
// Response shape is the union of what the three panels need:
//   { user, projects[], tasks[], people[] }
// Each task is pre-bucketed by due window so the client can render without
// re-walking the list.
export async function GET(req: NextRequest) {
  try {
    const { user: jwtUser, error } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const now      = new Date();
    const weekAgo  = new Date(now.getTime() - 7  * 86400000);
    const oid      = new mongoose.Types.ObjectId(jwtUser.sub);

    // Every query runs in parallel — total wall time ≈ slowest single query
    const [projects, myTasks, teams, owners, projectTaskAgg, perUserAgg, users] = await Promise.all([
      Project.find({}).sort({ createdAt: -1 }).lean(),
      Task.find({ assigneeId: oid }).sort({ status: 1, dueDate: 1 }).lean(),
      Team.find({}).lean(),
      User.find({}, '_id name').lean(),

      // Per-project rollup: total / done / open / overdue / lastCompletedAt
      Task.aggregate([
        {
          $group: {
            _id: '$projectId',
            total:           { $sum: 1 },
            done:            { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            overdue:         { $sum: { $cond: [
              { $and: [
                { $ne: ['$status', 'done'] },
                { $ne: ['$dueDate', null] },
                { $lt: ['$dueDate', now] },
              ] }, 1, 0,
            ] } },
            lastCompletedAt: { $max: { $cond: [{ $eq: ['$status', 'done'] }, '$completedAt', null] } },
          },
        },
      ]),

      // Per-assignee workload — single facet replaces three group queries
      Task.aggregate([
        {
          $facet: {
            open: [
              { $match: { status: { $ne: 'done' }, assigneeId: { $ne: null } } },
              { $group: { _id: '$assigneeId', c: { $sum: 1 } } },
            ],
            overdue: [
              { $match: { status: { $ne: 'done' }, dueDate: { $ne: null, $lt: now }, assigneeId: { $ne: null } } },
              { $group: { _id: '$assigneeId', c: { $sum: 1 } } },
            ],
            doneWeek: [
              { $match: { status: 'done', completedAt: { $gte: weekAgo }, assigneeId: { $ne: null } } },
              { $group: { _id: '$assigneeId', c: { $sum: 1 } } },
            ],
          },
        },
      ]),
      User.find({}).lean(),
    ]);

    // ── Lookups ──────────────────────────────────────────────────────────
    const teamName  = new Map(teams.map(t => [String(t._id), t.name]));
    const ownerName = new Map(owners.map(u => [String(u._id), u.name]));
    const projStats = new Map(projectTaskAgg.map((s: any) => [String(s._id), s]));

    // ── Projects payload ─────────────────────────────────────────────────
    const projectList = projects.map(p => {
      const s: any = projStats.get(String(p._id)) ?? { total: 0, done: 0, overdue: 0, lastCompletedAt: null };
      const open   = s.total - s.done;
      const stagnantDays = s.lastCompletedAt
        ? Math.floor((now.getTime() - new Date(s.lastCompletedAt).getTime()) / 86400000)
        : open > 0 ? 999 : 0;
      const daysUntilDue = p.dueDate ? Math.floor((new Date(p.dueDate).getTime() - now.getTime()) / 86400000) : null;

      // Rule-based health: critical if overdue or past-due project; at-risk
      // if anything overdue or stagnant; healthy otherwise. Same shape as
      // the old /api/insights so the client doesn't need a second branch.
      let health: 'healthy' | 'at_risk' | 'critical' = 'healthy';
      if (s.overdue >= 3 || (daysUntilDue !== null && daysUntilDue < 0 && open > 0)) health = 'critical';
      else if (s.overdue > 0 || stagnantDays >= 7 || (daysUntilDue !== null && daysUntilDue <= 5 && open > 0)) health = 'at_risk';

      return {
        ...projectS(p, {
          teamName:  teamName.get(String(p.teamId)) || null,
          ownerName: ownerName.get(String(p.ownerId)) || null,
          taskCount: s.total,
          tasksDone: s.done,
        }),
        openTasks:    open,
        overdueCount: s.overdue,
        health,
      };
    });

    // ── My tasks (sorted, enriched with project code/name) ───────────────
    const projMap = new Map(projects.map(p => [String(p._id), p]));
    const sortedTasks = myTasks.sort((a, b) => {
      const s = (STATUS_ORDER[a.status || ''] || 9) - (STATUS_ORDER[b.status || ''] || 9);
      if (s !== 0) return s;
      return (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
             (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
    });
    const taskList = sortedTasks.map(t => {
      const p = projMap.get(String(t.projectId));
      return taskS(t, { projectCode: p?.code, projectName: p?.name, lifecycle: p?.lifecycle });
    });

    // ── People workload ──────────────────────────────────────────────────
    const f       = perUserAgg[0];
    const openMap = new Map((f.open     as any[]).map(r => [String(r._id), r.c]));
    const ovMap   = new Map((f.overdue  as any[]).map(r => [String(r._id), r.c]));
    const doneMap = new Map((f.doneWeek as any[]).map(r => [String(r._id), r.c]));

    const people = users.map(u => {
      const uid = String(u._id);
      const openTasks         = (openMap.get(uid) as number) ?? 0;
      const overdueCount      = (ovMap.get(uid) as number) ?? 0;
      const completedThisWeek = (doneMap.get(uid) as number) ?? 0;
      const loadScore         = openTasks + overdueCount * 3;
      const loadLevel: 'healthy' | 'busy' | 'overloaded' =
        loadScore > 15 ? 'overloaded' : loadScore > 8 ? 'busy' : 'healthy';
      return {
        id:                uid,
        name:              u.name,
        title:             u.title || '',
        openTasks,
        overdueCount,
        completedThisWeek,
        loadScore,
        loadLevel,
      };
    }).sort((a, b) => b.loadScore - a.loadScore);

    return NextResponse.json({
      user: {
        id:    jwtUser.sub,
        name:  jwtUser.name,
        email: jwtUser.email,
        role:  jwtUser.role,
      },
      projects: projectList,
      tasks:    taskList,
      people,
    });
  } catch (e) {
    return handleError(e);
  }
}
