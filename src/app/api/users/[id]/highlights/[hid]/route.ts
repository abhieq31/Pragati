import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Highlight } from '@/models/Highlight';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** DELETE — remove one of your OWN highlights. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; hid: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    if (user.sub !== params.id) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
    await connectDB();
    await Highlight.deleteOne({ _id: params.hid, userId: user.sub });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
