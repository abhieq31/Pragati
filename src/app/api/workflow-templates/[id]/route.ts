import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WorkflowTemplate } from '@/models/WorkflowTemplate';
import { requireUser, isAdmin } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { WorkflowTemplateUpdateSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const template = await WorkflowTemplate.findById(params.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const isOwner = String(template.createdBy) === String(user.sub);
    if (!isOwner && !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await readBody(req, WorkflowTemplateUpdateSchema);
    if (body.name !== undefined) template.name = body.name;
    if (body.description !== undefined) template.description = body.description;
    if (body.phases !== undefined) template.phases = body.phases as any;
    await template.save();
    return NextResponse.json({
      id: String(template._id),
      name: template.name,
      description: template.description,
      createdBy: String(template.createdBy),
      createdByName: template.createdByName,
      phases: template.phases,
      createdAt: (template as any).createdAt,
    });
  } catch (e) {
    return handleError(e);
  }
}

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
