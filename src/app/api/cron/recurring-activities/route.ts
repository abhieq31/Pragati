import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { RecurringActivity } from '@/models/RecurringActivity';
import { generateOccurrence, hasOpenOccurrence } from '@/lib/recurring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Recurring-activity safety net.
 *
 * The primary path spawns the next occurrence the moment one is completed. This
 * cron covers the gaps: a series that paused because an occurrence was deleted,
 * or one whose occurrence was never completed and whose next is now due. For
 * every active activity with NO open occurrence, it creates one once the next
 * due date (minus its lead time) has arrived.
 *
 * Auth mirrors the digest cron: a Vercel-attached `Authorization: Bearer
 * <CRON_SECRET>` runs it unattended; otherwise an admin session is required.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get('authorization');
    const cronAuthed = !!secret && auth === `Bearer ${secret}`;
    if (!cronAuthed) {
      const { error } = await requireRole(req, 'admin', 'master_admin');
      if (error) return error;
    }

    await connectDB();
    const now = new Date();
    const active = await RecurringActivity.find({ active: true });

    let created = 0;
    let skipped = 0;
    for (const activity of active) {
      // Create only when the next occurrence is within its lead-time window and
      // nothing is currently open for this activity.
      const lead = (activity.leadTimeDays || 0) * 24 * 60 * 60 * 1000;
      const dueSoon = +new Date(activity.nextDueDate) - lead <= +now;
      if (!dueSoon) {
        skipped++;
        continue;
      }
      if (await hasOpenOccurrence(String(activity._id))) {
        skipped++;
        continue;
      }
      try {
        await generateOccurrence(activity);
        created++;
      } catch (e) {
        console.error('[recurring-cron] generate failed for', String(activity._id), e);
      }
    }

    return NextResponse.json(
      { ok: true, considered: active.length, created, skipped },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return handleError(e);
  }
}
