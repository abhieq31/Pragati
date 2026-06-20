import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { requireUser, canMutate, isAdmin } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError, readBody } from '@/lib/http';
import { CsvActivityUpdateSchema } from '@/lib/validations';
import { normalizeRows, serializeCsvActivity } from '@/lib/csvActivity';
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
    if (body.changeControlNo !== undefined) sheet.changeControlNo = body.changeControlNo;
    if (body.prNo !== undefined) sheet.prNo = body.prNo;
    if (body.title !== undefined) sheet.title = body.title;
    if (body.description !== undefined) sheet.description = body.description;
    if (body.rows !== undefined) sheet.rows = normalizeRows(body.rows) as any;
    await sheet.save();

    await logOperation({
      action: 'csv_activity.update',
      category: 'general',
      actor: user,
      targetType: 'csv_activity',
      targetId: String(sheet._id),
      targetLabel: sheet.changeControlNo,
      summary: `Updated CSV activity sheet ${sheet.changeControlNo}`,
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
      targetLabel: (sheet as any).changeControlNo,
      summary: `Deleted CSV activity sheet ${(sheet as any).changeControlNo}`,
      meta: { teamId: String((sheet as any).teamId) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
