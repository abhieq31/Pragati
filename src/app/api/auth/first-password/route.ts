import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { normalizeRole, requireUser, signToken, setAuthCookie } from '@/lib/auth';
import { readBody, handleError } from '@/lib/http';
import { isPasswordReused, pushPasswordHistory, PASSWORD_REUSE_MESSAGE } from '@/lib/passwordHistory';

export const runtime = 'nodejs';

const Body = z.object({ newPassword: z.string().min(8) });

export async function POST(req: NextRequest) {
  try {
    const { user: me, error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, Body);
    const user = await User.findById(me.sub);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.mustChangePassword) {
      return NextResponse.json({ error: 'Password already set' }, { status: 400 });
    }

    // Reuse guard — also applies to the forced first-set after an admin reset,
    // and crucially rejects the current default/temp password so the user can't
    // "change" it to the same value they just signed in with.
    const history: string[] = (user as any).passwordHistory || [];
    if (isPasswordReused(body.newPassword, user.passwordHash, history)) {
      return NextResponse.json({ error: PASSWORD_REUSE_MESSAGE }, { status: 400 });
    }

    const newHash = bcrypt.hashSync(body.newPassword, 10);
    (user as any).passwordHistory = pushPasswordHistory(user.passwordHash, history);
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    await user.save();

    // Re-issue token with mustChangePassword cleared, preserving the current
    // session identity so the user stays signed in on this device.
    const token = signToken({
      sub: String(user._id),
      email: user.email,
      role: normalizeRole(user.role),
      name: user.name,
      title: user.title || '',
      mustChangePassword: false,
      sv: user.sessionVersion ?? 0,
      sid: user.activeSessionId ?? undefined,
    });
    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    return handleError(e);
  }
}
