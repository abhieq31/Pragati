import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { PushSubscription } from '@/models/PushSubscription';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { pushConfigured } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(300),
    auth: z.string().min(1).max(100),
  }),
});

/** Register (or re-register) this browser for daily-brief pushes. */
export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    if (!pushConfigured()) {
      return NextResponse.json({ error: 'Push is not configured on this deployment.' }, { status: 503 });
    }
    await connectDB();
    const body = await readBody(req, SubscribeSchema);
    await PushSubscription.updateOne(
      { endpoint: body.endpoint },
      {
        $set: {
          userId: user!.sub,
          keys: body.keys,
          userAgent: (req.headers.get('user-agent') || '').slice(0, 300),
        },
      },
      { upsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

const UnsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

/** Remove this browser's subscription (only the owner can). */
export async function DELETE(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, UnsubscribeSchema);
    await PushSubscription.deleteOne({ endpoint: body.endpoint, userId: user!.sub });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
