import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { Project } from '@/models/Project';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

// Read the operational audit trail. Admin-only — the trail records management
// actions across the whole workspace, so only the workspace owner sees it.
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole(req, 'admin');
    if (error) return error;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = Math.min(Number(searchParams.get('limit')) || 150, 500);

    const filter: Record<string, any> = {};
    if (category && category !== 'all') filter.category = category;

    const [rows, personalProjects] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Project.find({ $or: [{ isPersonal: true }, { code: /^PRSN-/ }] }, '_id').lean(),
    ]);

    // Never surface personal project data in the operational audit trail —
    // personal projects are private to their owners, and should not appear in
    // a cross-user admin view even in log form.
    const personalIds = new Set(personalProjects.map((p: any) => String(p._id)));
    const visible = rows.filter((r: any) => {
      if (r.targetType === 'project' && personalIds.has(r.targetId)) return false;
      if (r.targetType === 'task' && r.meta?.projectId && personalIds.has(String(r.meta.projectId))) return false;
      return true;
    });

    return NextResponse.json(
      visible.map((r: any) => ({
        id: String(r._id),
        action: r.action,
        category: r.category,
        actorName: r.actorName || 'System',
        targetType: r.targetType || '',
        targetId: r.targetId || '',
        targetLabel: r.targetLabel || '',
        summary: r.summary || '',
        createdAt: r.createdAt,
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}
