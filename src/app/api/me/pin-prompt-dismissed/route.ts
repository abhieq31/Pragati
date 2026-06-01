import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

// Records that the user dismissed the Quick-PIN prompt with "Maybe later".
// Suppresses the blocking modal for this session; the next login still
// nudges them gently (deferred PIN remains the default until they either
// set one or explicitly opt out from Settings).
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    await User.updateOne({ _id: user!.sub }, { pinPromptDismissedAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
