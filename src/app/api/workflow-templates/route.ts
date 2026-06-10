import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WorkflowTemplate } from '@/models/WorkflowTemplate';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { WorkflowTemplateCreateSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const templates = await WorkflowTemplate.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      templates.map((t) => ({
        id: String(t._id),
        name: t.name,
        description: t.description,
        createdBy: String(t.createdBy),
        createdByName: t.createdByName,
        phases: t.phases,
        createdAt: (t as any).createdAt,
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, WorkflowTemplateCreateSchema);
    const template = await WorkflowTemplate.create({
      name: body.name,
      description: body.description || '',
      createdBy: user.sub,
      createdByName: user.name || '',
      phases: body.phases,
    });
    return NextResponse.json(
      {
        id: String(template._id),
        name: template.name,
        description: template.description,
        createdBy: String(template.createdBy),
        createdByName: template.createdByName,
        phases: template.phases,
        createdAt: (template as any).createdAt,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
