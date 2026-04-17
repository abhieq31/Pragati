import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

function escapeCsv(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const { searchParams } = req.nextUrl;
    const q: any = {};
    const projectId = searchParams.get('projectId');
    if (projectId) q.projectId = projectId;

    const tasks = await Task.find(q).lean();
    const projects = await Project.find({}).lean();
    const users = await User.find({}).lean();
    const apps = await Application.find({}).lean();
    const pMap = new Map(projects.map((p: any) => [String(p._id), p]));
    const uMap = new Map(users.map((u: any) => [String(u._id), u.name]));
    const aMap = new Map(apps.map((a: any) => [String(a._id), a.key]));

    const headers = [
      'title',
      'application',
      'projectCode',
      'projectName',
      'phase',
      'status',
      'priority',
      'type',
      'assignee',
      'startDate',
      'dueDate',
      'completedAt',
      'gxpCritical',
      'requiresQaSignoff',
      'qaSignoffBy',
      'qaSignoffAt',
      'subtasks'
    ];

    const rows = tasks.map((t: any) => {
      const p = pMap.get(String(t.projectId)) as any;
      const phase = p?.phases?.find?.((ph: any) => String(ph._id) === String(t.phaseId));
      return [
        t.title,
        aMap.get(String(p?.applicationId)) || '',
        p?.code || '',
        p?.name || '',
        phase?.name || '',
        t.status,
        t.priority,
        t.taskType,
        uMap.get(String(t.assigneeId)) || '',
        t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : '',
        t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
        t.completedAt ? new Date(t.completedAt).toISOString().slice(0, 10) : '',
        t.gxpCritical ? 'yes' : '',
        t.requiresQaSignoff ? 'yes' : '',
        uMap.get(String(t.qaSignoffUserId)) || '',
        t.qaSignoffAt ? new Date(t.qaSignoffAt).toISOString().slice(0, 10) : '',
        (t.subtasks || []).map((s: any) => `${s.title}${s.status === 'done' ? ' ✓' : ''}`).join(' | ')
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="qinformx-tasks-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (e) {
    return handleError(e);
  }
}
