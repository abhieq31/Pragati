import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { requireUser, canMutate } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError, readBody } from '@/lib/http';
import { CsvActivityCreateSchema } from '@/lib/validations';
import { normalizeRows, normalizeStageDefs, serializeCsvActivity } from '@/lib/csvActivity';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

// Tracker sheets live inside a team's QMS module. Every read/write is
// gated by team membership; a ?teamId= is required to list.
export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const teamId = req.nextUrl.searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    const denied = await guardTeamMember(teamId, String(user.sub), user.role);
    if (denied) return denied;
    const sheets = await CsvActivity.find({ teamId }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json(sheets.map((s) => serializeCsvActivity(s)));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    if (!canMutate(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    await connectDB();
    const body = await readBody(req, CsvActivityCreateSchema);
    const denied = await guardTeamMember(body.teamId, String(user.sub), user.role);
    if (denied) return denied;
    const stages = normalizeStageDefs(body.stages);
    const sheet = await CsvActivity.create({
      teamId: body.teamId,
      reference: body.reference,
      reference2: body.reference2 || '',
      title: body.title || '',
      description: body.description || '',
      stages,
      createdBy: user.sub,
      createdByName: user.name || '',
      rows: normalizeRows(body.rows, stages),
    });
    await logOperation({
      action: 'csv_activity.create',
      category: 'general',
      actor: user,
      targetType: 'csv_activity',
      targetId: String(sheet._id),
      targetLabel: sheet.reference,
      summary: `Created tracker sheet ${sheet.reference}`,
      meta: { teamId: body.teamId },
    });
    return NextResponse.json(serializeCsvActivity(sheet), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
