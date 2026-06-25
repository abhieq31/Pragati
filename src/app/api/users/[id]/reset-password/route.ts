import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { rateLimit } from '@/lib/rateLimit';
import { logOperation } from '@/lib/audit';
import { defaultPassword, canUseDefaultPassword } from '@/lib/defaultPassword';

export const runtime = 'nodejs';

// Admin-only password reset: the workspace admin resets another user's
// password and gets back the password to share verbally / over chat. No SMTP
// round-trip.
//
// The reset restores the same standard default used when the account was
// created — `FirstName@employeeId` — so there's one predictable credential an
// admin can hand out, rather than a fresh random string each time. Accounts
// without an employee ID fall back to a random temporary password. Either way
// the target is forced to set their own password on next login.
//
// Flow:
//   1. Admin opens /people, clicks "Reset password" on a row.
//   2. UI calls POST /api/users/[id]/reset-password.
//   3. Endpoint returns { tempPassword, isDefault } and flips the target's
//      mustChangePassword flag.
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const rand = crypto.randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[rand[i] % chars.length];
  return `Pragati-${s}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireRole(req, 'admin');
    if (error) return error;

    // Throttle per actor — even a logged-in lead shouldn't be able to
    // mass-rotate every account in the workspace within a minute.
    if (!rateLimit(`reset:${user!.sub}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many resets — wait a minute.' }, { status: 429 });
    }
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }
    await connectDB();

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Restore the standard default (FirstName@employeeId) when we can; fall
    // back to a random temp password for accounts with no employee ID.
    const isDefault = canUseDefaultPassword(target.employeeId);
    const tempPassword = isDefault
      ? defaultPassword(target.name, target.employeeId)
      : generateTempPassword();
    target.passwordHash = bcrypt.hashSync(tempPassword, 10);
    target.mustChangePassword = true;
    // Resetting the password implicitly lifts any brute-force lock —
    // otherwise the user would still be locked out with the new temp
    // password and admin would have to make two clicks.
    target.failedLoginAttempts = 0;
    target.lockedAt = null;
    // Force-logout every existing session for this user: a reset means the
    // old credential is dead, so any device still holding a token must be
    // kicked out immediately.
    target.sessionVersion = (target.sessionVersion ?? 0) + 1;
    target.activeSessionId = null;
    await target.save();

    await logOperation({
      action: 'user.reset',
      category: 'user',
      actor: user,
      targetType: 'user',
      targetId: params.id,
      targetLabel: target.name,
      summary: `Reset password for ${target.name}`,
    });

    return NextResponse.json({
      ok: true,
      tempPassword,
      isDefault,
      user: { id: String(target._id), email: target.email, name: target.name },
    });
  } catch (e) {
    return handleError(e);
  }
}
