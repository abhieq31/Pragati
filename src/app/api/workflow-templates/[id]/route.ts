import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WorkflowTemplate } from '@/models/WorkflowTemplate';
import { requireUser, isAdmin } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const template = await WorkflowTemplate.findById(params.id).lean();
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const isOwner = String(template.createdBy) === String(user.sub);
    if (!isOwner && !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await WorkflowTemplate.deleteOne({ _id: params.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
