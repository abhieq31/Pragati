import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { TicketLog } from '@/models/TicketLog';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { getLeadScope, projectsVisibleFilter } from '@/lib/leadScope';
import { TicketLogCreateSchema } from '@/lib/validations';
import { digestTimeZone, localDateKey } from '@/lib/digest';
import { summarizeTickets, type TicketEntry } from '@/lib/tickets';

export const runtime = 'nodejs';

// Keep the read bounded — a project that's logged daily for years shouldn't pull
// an unbounded series. 200 days is far more than any trend window needs.
const MAX_DAYS = 200;

/** Load a project's recent ticket series (oldest→newest) and its summary. */
async function loadSeries(projectId: string) {
  const rows = await TicketLog.find({ projectId })
    .select('dateKey open logged resolved note loggedBy updatedAt')
    .sort({ dateKey: -1 })
    .limit(MAX_DAYS)
    .lean();
  rows.reverse(); // back to ascending by day for the time series
  const entries: TicketEntry[] = rows.map((r) => ({
    dateKey: r.dateKey,
    open: r.open || 0,
    logged: r.logged || 0,
    resolved: r.resolved || 0,
  }));
  return {
    entries: rows.map((r) => ({
      dateKey: r.dateKey,
      open: r.open || 0,
      logged: r.logged || 0,
      resolved: r.resolved || 0,
      note: r.note || '',
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    })),
    summary: summarizeTickets(entries),
  };
}

async function getVisibleProject(id: string, userId: string, role?: string | null) {
  const scope = await getLeadScope(userId, role);
  return Project.findOne({ _id: id, ...projectsVisibleFilter(scope) })
    .select('teamId trackTickets ticketLabel name code')
    .lean();
}

// GET /api/projects/[id]/tickets — the daily series + computed summary.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const p = await getVisibleProject(params.id, user!.sub, user!.role);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { entries, summary } = await loadSeries(String((p as any)._id));
    return NextResponse.json({
      trackTickets: !!(p as any).trackTickets,
      label: (p as any).ticketLabel || 'Support tickets',
      today: localDateKey(new Date(), digestTimeZone()),
      entries,
      summary,
    });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/projects/[id]/tickets — log (or correct) one day's reading.
// Anyone who can see the project may log it; the daily count is an operational
// metric, not a controlled GxP record, so no e-signature is required.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const p = await getVisibleProject(params.id, user!.sub, user!.role);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!(p as any).trackTickets) {
      return NextResponse.json(
        { error: 'Ticket tracking is off for this project. Turn it on in project settings first.' },
        { status: 400 },
      );
    }

    const body = await readBody(req, TicketLogCreateSchema);
    const dateKey = body.date || localDateKey(new Date(), digestTimeZone());

    // Merge over any existing reading for the day so a partial correction (e.g.
    // just the resolved count) doesn't wipe the other figures.
    const existing = await TicketLog.findOne({ projectId: (p as any)._id, dateKey })
      .select('open logged resolved note')
      .lean();
    const open = body.open ?? (existing as any)?.open ?? 0;
    const logged = body.logged ?? (existing as any)?.logged ?? 0;
    const resolved = body.resolved ?? (existing as any)?.resolved ?? 0;
    const note = body.note ?? (existing as any)?.note ?? '';

    await TicketLog.updateOne(
      { projectId: (p as any)._id, dateKey },
      {
        $set: { open, logged, resolved, note, loggedBy: user!.sub, teamId: (p as any).teamId || null },
        $setOnInsert: { projectId: (p as any)._id, dateKey },
      },
      { upsert: true },
    );

    const { entries, summary } = await loadSeries(String((p as any)._id));
    return NextResponse.json({
      ok: true,
      label: (p as any).ticketLabel || 'Support tickets',
      today: localDateKey(new Date(), digestTimeZone()),
      entries,
      summary,
    });
  } catch (e) {
    return handleError(e);
  }
}
