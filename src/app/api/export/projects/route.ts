import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { Team } from '@/models/Team';
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
    const projects = await Project.find({}).lean();
    const [teams, owners, apps] = await Promise.all([
      Team.find({}).lean(),
      User.find({}).lean(),
      Application.find({}).lean()
    ]);
    const tMap = new Map(teams.map((t) => [String(t._id), t.name]));
    const oMap = new Map(owners.map((o) => [String(o._id), o.name]));
    const aMap = new Map(apps.map((a: any) => [String(a._id), a.key]));

    const headers = [
      'code',
      'name',
      'application',
      'team',
      'owner',
      'lifecycle',
      'status',
      'priority',
      'gxpImpact',
      'startDate',
      'dueDate',
      'completedAt',
      'description'
    ];
    const rows = projects.map((p: any) => {
      return [
        p.code,
        p.name,
        aMap.get(String(p.applicationId)) || '',
        tMap.get(String(p.teamId)) || '',
        oMap.get(String(p.ownerId)) || '',
        p.lifecycle,
        p.status,
        p.priority,
        p.gxpImpact,
        p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '',
        p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : '',
        p.completedAt ? new Date(p.completedAt).toISOString().slice(0, 10) : '',
        p.description || ''
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="qinformx-projects-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (e) {
    return handleError(e);
  }
}
