import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { appBaseUrl } from '@/lib/digest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function feedUrl(token: string | null): string | null {
  if (!token) return null;
  const base = appBaseUrl();
  return `${base || ''}/api/calendar/${token}`;
}

/** Current state of the viewer's calendar-feed token. */
export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const u = await User.findById(user!.sub).select('icsToken').lean();
    return NextResponse.json(
      { enabled: !!(u as any)?.icsToken, url: feedUrl((u as any)?.icsToken || null) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return handleError(e);
  }
}

/** Mint (or rotate) the token. Rotating invalidates the old URL immediately. */
export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const token = crypto.randomBytes(24).toString('hex');
    await User.updateOne({ _id: user!.sub }, { $set: { icsToken: token } });
    return NextResponse.json({ enabled: true, url: feedUrl(token) });
  } catch (e) {
    return handleError(e);
  }
}

/** Revoke the token — the old feed URL stops working at once. */
export async function DELETE(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    await User.updateOne({ _id: user!.sub }, { $set: { icsToken: null } });
    return NextResponse.json({ enabled: false, url: null });
  } catch (e) {
    return handleError(e);
  }
}
