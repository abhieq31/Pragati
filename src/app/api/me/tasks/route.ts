import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Project } from '@/models/Project';
import { Application } from '@/models/Application';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { task as taskS } from '@/lib/serialize';

export const runtime = 'nodejs';

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  review: 1,
  blocked: 2,
  todo: 3,
  done: 4
};

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const userId = user.sub;

    const [tasks, allProjects] = await Promise.all([
      Task.find({ assigneeId: userId }).lean(),
      Project.find({}).select('_id code name lifecycle applicationId phases').lean()
    ]);
    const pMap = new Map(allProjects.map((p) => [String(p._id), p]));

    // build application lookup for the macro trail
    const appIds = [...new Set(allProjects.map((p: any) => String(p.applicationId)).filter(Boolean))];
    const apps = appIds.length
      ? await Application.find({ _id: { $in: appIds } })
          .select('_id key name')
          .lean()
      : [];
    const aMap = new Map(apps.map((a: any) => [String(a._id), a]));

    const sortedTasks = tasks.sort((a, b) => {
      const s = (STATUS_ORDER[a.status || ''] || 9) - (STATUS_ORDER[b.status || ''] || 9);
      if (s !== 0) return s;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });

    const subtaskHolders = await Task.find({ 'subtasks.assigneeId': userId }).lean();
    const subtasks: any[] = [];
    for (const t of subtaskHolders) {
      const p = pMap.get(String(t.projectId)) as any;
      for (const s of (t as any).subtasks || []) {
        if (String(s.assigneeId) === userId) {
          subtasks.push({
            id: String(s._id),
            title: s.title,
            status: s.status,
            dueDate: s.dueDate,
            completedAt: s.completedAt,
            taskTitle: t.title,
            taskId: String(t._id),
            projectCode: p?.code,
            projectName: p?.name
          });
        }
      }
    }

    return NextResponse.json({
      tasks: sortedTasks.map((t) => {
        const p = pMap.get(String(t.projectId)) as any;
        const app = p?.applicationId ? (aMap.get(String(p.applicationId)) as any) : null;
        const phase =
          t.phaseId && p?.phases
            ? (p.phases as any[]).find((ph: any) => String(ph._id) === String(t.phaseId))
            : null;
        return taskS(t, {
          projectCode: p?.code,
          projectName: p?.name,
          lifecycle: p?.lifecycle,
          applicationId: app ? String(app._id) : null,
          applicationKey: app?.key || null,
          phaseName: phase?.name || null,
          subtaskCount: ((t as any).subtasks || []).length,
          subtasksDone: ((t as any).subtasks || []).filter((s: any) => s.status === 'done').length
        });
      }),
      subtasks
    });
  } catch (e) {
    return handleError(e);
  }
}
