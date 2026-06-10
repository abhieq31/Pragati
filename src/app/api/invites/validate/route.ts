import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Invite } from '@/models/Invite';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';

// GET /api/invites/validate?token=… — public endpoint used by the signup
// page to verify a token before the user fills in their details. Never
// returns the token itself; only enough to render the form.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
    await connectDB();

    const invite = await Invite.findOne({ token }).lean();
    if (!invite) return NextResponse.json({ valid: false, reason: 'not_found' });
    if (invite.revokedAt) return NextResponse.json({ valid: false, reason: 'revoked' });
    if (invite.consumedAt) return NextResponse.json({ valid: false, reason: 'consumed' });
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      invitedByName: invite.invitedByName,
      expiresAt: invite.expiresAt,
    });
  } catch (e) {
    return handleError(e);
  }
}
