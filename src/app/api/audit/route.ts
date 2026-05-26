import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

/**
 * Operations log feed — admin only. Returns the most recent entries,
 * newest first, with an optional ?action= filter and ?limit= (capped).
 * The log is append-only; there is no write/delete path here.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole(req, 'admin');
    if (error) return error;
    await connectDB();

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 300);

    const q: any = {};
    if (action) q.action = action;

    const entries = await AuditLog.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json(
      entries.map((e) => ({
        id:        String(e._id),
        actorName: e.actorName || 'System',
        actorRole: e.actorRole || '',
        action:    e.action,
        entityType: e.entityType,
        summary:   e.summary,
        createdAt: e.createdAt,
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}
