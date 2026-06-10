import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

// Clear a user's failed-login lock without resetting their password.
// Use this when the lock was caused by typos or a brief password fumble
// and the user still knows their real password — saves the awkward
// "here's a temp password" handoff.
//
// Admin-only: lifting a lockout is an audit-bearing action that affects
// the system's brute-force protection, and user management is reserved
// for the single workspace admin.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireRole(req, 'admin');
    if (error) return error;
    await connectDB();

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    target.failedLoginAttempts = 0;
    target.lockedAt = null;
    await target.save();

    await logOperation({
      action: 'user.unlock',
      category: 'user',
      actor: user,
      targetType: 'user',
      targetId: params.id,
      targetLabel: target.name,
      summary: `Unlocked account for ${target.name}`,
    });

    return NextResponse.json({
      ok: true,
      user: { id: String(target._id), email: target.email, name: target.name },
    });
  } catch (e) {
    return handleError(e);
  }
}
