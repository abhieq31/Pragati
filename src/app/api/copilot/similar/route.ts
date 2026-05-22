import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

// GET /api/copilot/similar?taskId=<id>
// Returns up to 3 closed tasks with the same taskType in the same project.
// Used by the context-aware copilot to surface "what worked before".
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;

    const taskId = req.nextUrl.searchParams.get('taskId');
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    await connectDB();

    const source = await Task.findById(taskId)
      .select('projectId taskType title')
      .lean()
      .exec();

    if (!source) return NextResponse.json({ similar: [] });

    const docs = await Task.find({
      _id: { $ne: source._id },
      projectId: source.projectId,
      taskType: source.taskType,
      status: 'done',
    })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('title status completedAt priority gxpCritical assigneeName')
      .lean()
      .exec();

    const similar = docs.map((t: any) => ({
      id: String(t._id),
      title: t.title,
      completedAt: t.completedAt ? (t.completedAt as Date).toISOString() : null,
      priority: t.priority,
      gxpCritical: t.gxpCritical,
    }));

    return NextResponse.json({ similar, taskType: source.taskType });
  } catch (e) {
    return handleError(e);
  }
}
