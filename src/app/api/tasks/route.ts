import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { task as taskS } from '@/lib/serialize';

export const runtime = 'nodejs';

const Create = z.object({
  projectId: z.string(),
  phaseId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  taskType: z
    .enum(['task', 'review', 'approval', 'test', 'deviation', 'capa', 'audit_finding', 'data_review'])
    .optional(),
  gxpCritical: z.boolean().optional(),
  requiresQaSignoff: z.boolean().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  // Pharma fields
  ccNo:           z.string().optional(),
  ccTcd:          z.string().optional(),
  documentNo:     z.string().optional(),
  applicableSite: z.enum(['val', 'prd', 'val_prd', 'na']).optional(),
  deployStage:    z.enum(['dev', 'int', 'prd', 'na']).optional(),
  remarks:        z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, Create);
    const task = await Task.create({
      projectId: body.projectId,
      phaseId: body.phaseId,
      title: body.title,
      description: body.description || '',
      assigneeId: body.assigneeId || undefined,
      priority: body.priority || 'medium',
      taskType: body.taskType || 'task',
      gxpCritical: !!body.gxpCritical,
      requiresQaSignoff: !!body.requiresQaSignoff,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      estimatedHours: body.estimatedHours,
      ccNo:           body.ccNo           || '',
      ccTcd:          body.ccTcd ? new Date(body.ccTcd) : undefined,
      documentNo:     body.documentNo     || '',
      applicableSite: body.applicableSite || 'na',
      deployStage:    body.deployStage    || 'na',
      remarks:        body.remarks        || '',
    });
    return NextResponse.json(taskS(task));
  } catch (e) {
    return handleError(e);
  }
}
