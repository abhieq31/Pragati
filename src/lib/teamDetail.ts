import { connectDB } from '@/lib/db';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { team as teamS, u, project as projectS, task as taskS, date as toIso } from '@/lib/serialize';

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0, review: 1, blocked: 2, todo: 3, done: 4,
};

/**
 * Server-side team detail fetcher — mirrors GET /api/teams/[id] +
 * GET /api/teams/[id]/board in a single DB round-trip set.
 * Returns null when the team doesn't exist or the viewer is not a member.
 * Used by the server page so the first HTML byte contains real content.
 */
export async function getTeamDetail(
  id: string,
  userId: string,
  role?: string | null,
): Promise<{ team: any; board: any[] } | null> {
  try {
    await connectDB();
    const t = await Team.findById(id).lean();
    if (!t) return null;

    // Membership guard — same rule as the API route.
    const me = String(userId);
    const isMember =
      String((t as any).leadId || '') === me ||
      ((t as any).memberIds || []).some((m: any) => String(m) === me);
    if (!isMember) return null;

    const memberIds = (t as any).memberIds || [];
    const [members, projects] = await Promise.all([
      User.find({ _id: { $in: memberIds } }).lean(),
      Project.find({ teamId: id }).lean(),
    ]);

    // Task counts for each project (for the projects tab cards).
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projects.map((p) => p._id) } } },
      { $group: { _id: { projectId: '$projectId', status: '$status' }, c: { $sum: 1 } } },
    ]);
    const projectAgg = new Map<string, { total: number; done: number }>();
    for (const c of taskCounts) {
      const key = String(c._id.projectId);
      const e = projectAgg.get(key) || { total: 0, done: 0 };
      e.total += c.c;
      if (c._id.status === 'done') e.done += c.c;
      projectAgg.set(key, e);
    }

    // Board tasks — all tasks across team projects, respecting privacy.
    const boardTasks = await Task.find({
      projectId: { $in: projects.map((p) => p._id) },
      $or: [
        { privateToUserId: null },
        { privateToUserId: { $exists: false } },
        { privateToUserId: userId },
      ],
    }).lean();

    const assigneeIds = boardTasks.map((t) => t.assigneeId).filter(Boolean);
    const assignees = await User.find({ _id: { $in: assigneeIds } }).lean();
    const uMap = new Map(assignees.map((a) => [String(a._id), (a as any).name]));
    const pMap = new Map(projects.map((p) => [String(p._id), p]));

    boardTasks.sort((a, b) => {
      const ad = (a as any).ccTcd
        ? new Date((a as any).ccTcd).getTime()
        : a.dueDate ? new Date(a.dueDate as any).getTime() : Infinity;
      const bd = (b as any).ccTcd
        ? new Date((b as any).ccTcd).getTime()
        : b.dueDate ? new Date(b.dueDate as any).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return (STATUS_ORDER[a.status || ''] || 9) - (STATUS_ORDER[b.status || ''] || 9);
    });

    return {
      team: {
        ...(teamS(t) as any),
        members: members.filter((m: any) => m.role !== 'admin').map(u),
        projects: projects.map((p) => {
          const agg = projectAgg.get(String(p._id));
          return projectS(p, { taskCount: agg?.total || 0, tasksDone: agg?.done || 0 });
        }),
      },
      board: boardTasks.map((bt) => {
        const p = pMap.get(String(bt.projectId));
        return taskS(bt, {
          projectCode: (p as any)?.code,
          projectName: (p as any)?.name,
          lifecycle: (p as any)?.lifecycle,
          assigneeName: bt.assigneeId ? uMap.get(String(bt.assigneeId)) : null,
          subtaskCount: ((bt as any).subtasks || []).length,
          subtasksDone: ((bt as any).subtasks || []).filter((s: any) => s.status === 'done').length,
        });
      }),
    };
  } catch (e) {
    console.error('[getTeamDetail] failed', e);
    return null;
  }
}
