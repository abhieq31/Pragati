import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { findPastCases, checkCapaEffectiveness } from '@/lib/qualitySignals';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
    }

    await connectDB();
    const task = await Task.findById(params.id)
      .select('status completedAt taskType')
      .lean() as any;
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isClosed = task.status === 'done' && task.completedAt;

    const [pastCases, effectiveness] = await Promise.all([
      findPastCases(params.id),
      isClosed
        ? checkCapaEffectiveness(params.id, new Date(task.completedAt))
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ pastCases, effectiveness });
  } catch (e) {
    return handleError(e);
  }
}
