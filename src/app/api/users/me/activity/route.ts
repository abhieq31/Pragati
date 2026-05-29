import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

// Daily completion counts for the signed-in user over the last ~year, powering
// the GitHub-style contribution graph on the profile page (#7). Counts tasks
// the user was assigned that were completed on each day.
export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const since = new Date();
    since.setDate(since.getDate() - 363);
    since.setHours(0, 0, 0, 0);

    const rows = await Task.aggregate([
      {
        $match: {
          assigneeId: new mongoose.Types.ObjectId(user.sub),
          completedAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const days: Record<string, number> = {};
    for (const r of rows) days[r._id] = r.count;

    return NextResponse.json({ since: since.toISOString().slice(0, 10), days });
  } catch (e) {
    return handleError(e);
  }
}
