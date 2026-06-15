import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import {
  buildAndSendDailyDigests,
  digestWindowOpen,
  hourInTz,
  minuteInTz,
  digestTimeZone,
} from '@/lib/digest';
import { sendDailyBriefPushes } from '@/lib/push';

export const runtime = 'nodejs';
// Never statically evaluated — this route reads the clock and the DB on every
// hit and must never be cached.
export const dynamic = 'force-dynamic';
// Sending is sequential; give the function room for a batch of recipients.
export const maxDuration = 60;

/**
 * Daily task-due email digest.
 *
 * Triggered three ways, all funnelling into the same builder:
 *   1. Vercel Cron (08:30 IST — see vercel.json). When CRON_SECRET is set,
 *      Vercel attaches `Authorization: Bearer <CRON_SECRET>` automatically; we
 *      require it. Fail-closed: with no secret and no admin session the request
 *      is rejected, so the endpoint can never become an open email cannon.
 *   2. Manual admin run — an authenticated admin hits it to force a send now.
 *   3. Admin test — `?test=1` sends a single sample digest to the admin's own
 *      address, ignoring opt-in / master-switch / empty-skip, so delivery can
 *      be verified from the Settings panel.
 */
export async function GET(req: NextRequest) {
  try {
    const isTest = req.nextUrl.searchParams.get('test') === '1';
    const isWelcome = req.nextUrl.searchParams.get('welcome') === '1';

    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get('authorization');
    const cronAuthed = !!secret && auth === `Bearer ${secret}`;

    // Test / welcome modes email the CALLER and only the caller — so any
    // signed-in user may run them to verify their own delivery ("I turned it on
    // but nothing arrives") or to receive their first brief the instant they
    // opt in. Full manual runs (everyone's digest) stay admin-only.
    // Master-admin is a strict superset of admin everywhere in the app.
    let callerId: string | null = null;
    if (isTest || isWelcome) {
      const { user, error } = await requireUser(req);
      if (error) return error;
      callerId = user!.sub;
    } else if (!cronAuthed) {
      const { user, error } = await requireRole(req, 'admin', 'master_admin');
      if (error) return error;
      callerId = user.sub;
    }

    if (isTest || isWelcome) {
      const summary = await buildAndSendDailyDigests(
        isTest ? { test: true, onlyUserId: callerId! } : { welcome: true, onlyUserId: callerId! },
      );
      return NextResponse.json(
        { mode: isTest ? 'test' : 'welcome', ...summary },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // A scheduled (cron-secret) tick sends the whole opted-in batch only in
    // the fixed 08:30 workspace-time window and is idempotent per day, so both
    // Vercel Cron and the five-minute GitHub Action can safely trigger it.
    // A manual admin run (?force or just authed, no secret) serves everyone
    // immediately. `?force=1` does the same on a secret-authenticated call.
    const force = req.nextUrl.searchParams.get('force') === '1';
    const now = new Date();
    const tz = digestTimeZone();
    const scheduledHour = cronAuthed && !force ? hourInTz(now, tz) : undefined;
    const scheduledMinute = cronAuthed && !force ? minuteInTz(now, tz) : undefined;

    const summary = await buildAndSendDailyDigests({ scheduledHour, scheduledMinute });
    // Same beat, second channel: the zero-cost Web Push fan-out. Failures
    // here must never fail the email run — push is best-effort by design.
    const pushWindowOpen = digestWindowOpen(scheduledHour, scheduledMinute);
    const push = pushWindowOpen
      ? await sendDailyBriefPushes({ now }).catch(() => ({ users: 0, delivered: 0 }))
      : { users: 0, delivered: 0 };
    return NextResponse.json(
      {
        mode: cronAuthed ? 'cron' : 'manual',
        scheduledHour: scheduledHour ?? null,
        scheduledMinute: scheduledMinute ?? null,
        ...summary,
        push,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return handleError(e);
  }
}
