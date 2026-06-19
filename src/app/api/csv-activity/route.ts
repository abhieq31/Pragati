import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { requireUser, canMutate } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { CsvActivityCreateSchema } from '@/lib/validations';
import { normalizeRows, serializeCsvActivity } from '@/lib/csvActivity';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const sheets = await CsvActivity.find().sort({ createdAt: -1 }).limit(200);
    // List view only needs the header + a count, but serialize is cheap and
    // keeps one shape; the grid page refetches the full sheet by id anyway.
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
    const sheet = await CsvActivity.create({
      changeControlNo: body.changeControlNo,
      prNo: body.prNo || '',
      title: body.title || '',
      description: body.description || '',
      createdBy: user.sub,
      createdByName: user.name || '',
      rows: normalizeRows(body.rows),
    });
    await logOperation({
      action: 'csv_activity.create',
      category: 'general',
      actor: user,
      targetType: 'csv_activity',
      targetId: String(sheet._id),
      targetLabel: sheet.changeControlNo,
      summary: `Created CSV activity sheet ${sheet.changeControlNo}`,
    });
    return NextResponse.json(serializeCsvActivity(sheet), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
