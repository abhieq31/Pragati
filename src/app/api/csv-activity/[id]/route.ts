import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { requireUser, canMutate, isAdmin } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError, readBody } from '@/lib/http';
import { CsvActivityUpdateSchema } from '@/lib/validations';
import { normalizeRows, normalizeStageDefs, serializeCsvActivity } from '@/lib/csvActivity';
import { sheetStages } from '@/lib/csvStages';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const sheet = await CsvActivity.findById(params.id);
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    const denied = await guardTeamMember(String(sheet.teamId), String(user.sub), user.role);
    if (denied) return denied;
    return NextResponse.json(serializeCsvActivity(sheet));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    if (!canMutate(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    await connectDB();
    const sheet = await CsvActivity.findById(params.id);
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    const denied = await guardTeamMember(String(sheet.teamId), String(user.sub), user.role);
    if (denied) return denied;

    const body = await readBody(req, CsvActivityUpdateSchema);
    if (body.reference !== undefined) sheet.reference = body.reference;
    if (body.reference2 !== undefined) sheet.reference2 = body.reference2;
    if (body.title !== undefined) sheet.title = body.title;
    if (body.description !== undefined) sheet.description = body.description;
    // Column changes re-shape every row, so resolve the effective stage defs
    // first, then normalize rows against them.
    const stages = body.stages !== undefined ? normalizeStageDefs(body.stages) : sheetStages(sheet.stages);
    if (body.stages !== undefined) sheet.stages = stages as any;
    if (body.rows !== undefined) sheet.rows = normalizeRows(body.rows, stages) as any;
    await sheet.save();

    await logOperation({
      action: 'csv_activity.update',
      category: 'general',
      actor: user,
      targetType: 'csv_activity',
      targetId: String(sheet._id),
      targetLabel: sheet.reference,
      summary: `Updated tracker sheet ${sheet.reference}`,
      meta: { teamId: String(sheet.teamId) },
    });
    return NextResponse.json(serializeCsvActivity(sheet));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const sheet = await CsvActivity.findById(params.id).lean();
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    const denied = await guardTeamMember(String((sheet as any).teamId), String(user.sub), user.role);
    if (denied) return denied;
    const isOwner = String((sheet as any).createdBy) === String(user.sub);
    if (!isOwner && !isAdmin(user.role) && user.role !== 'lead') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await CsvActivity.deleteOne({ _id: params.id });
    await logOperation({
      action: 'csv_activity.delete',
      category: 'general',
      actor: user,
      targetType: 'csv_activity',
      targetId: String(params.id),
      targetLabel: (sheet as any).reference || (sheet as any).changeControlNo,
      summary: `Deleted tracker sheet ${(sheet as any).reference || (sheet as any).changeControlNo || ''}`,
      meta: { teamId: String((sheet as any).teamId) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
