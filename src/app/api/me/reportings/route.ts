import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import { u } from '@/lib/serialize';

export const runtime = 'nodejs';

// Returns per-direct-report metrics so a manager can see, at a glance,
// what each of their people is doing this week -- without chasing Excel
// updates on Monday morning.
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const managerId = new mongoose.Types.ObjectId(user.sub);
    const reports = await User.find({ reportsToId: managerId })
      .sort({ name: 1 })
      .lean();
    if (reports.length === 0) {
      return NextResponse.json({ reportings: [] });
    }
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    const reportings = await Promise.all(
      reports.map(async (rpt: any) => {
        const uid = rpt._id;
        const [assigned, done, open, overdue, dueThisWeek, gxpOpen] = await Promise.all([
          Task.countDocuments({ assigneeId: uid }),
          Task.countDocuments({ assigneeId: uid, status: 'done' }),
          Task.countDocuments({ assigneeId: uid, status: { $ne: 'done' } }),
          Task.countDocuments({
            assigneeId: uid,
            status: { $ne: 'done' },
            dueDate: { $ne: null, $lt: now }
          }),
          Task.countDocuments({
            assigneeId: uid,
            status: { $ne: 'done' },
            dueDate: { $ne: null, $gte: now, $lte: in7 }
          }),
          Task.countDocuments({
            assigneeId: uid,
            status: { $ne: 'done' },
            gxpCritical: true
          })
        ]);
        // Tasks completed in the last 7 days -- a small "last week throughput" signal
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const closedLast7 = await Task.countDocuments({
          assigneeId: uid,
          status: 'done',
          completedAt: { $gte: sevenDaysAgo }
        });
        return {
          ...u(rpt),
          metrics: {
            assigned,
            done,
            open,
            overdue,
            dueThisWeek,
            gxpOpen,
            closedLast7,
            completionRate: assigned ? Math.round((done / assigned) * 100) : 0
          }
        };
      })
    );
    return NextResponse.json({ reportings });
  } catch (e) {
    return handleError(e);
  }
}
