import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { readBody, handleError } from '@/lib/http';
import { rateLimit } from '@/lib/rateLimit';
import { isPasswordReused, pushPasswordHistory, PASSWORD_REUSE_MESSAGE } from '@/lib/passwordHistory';

export const runtime = 'nodejs';

const Body = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  try {
    const { user: me, error } = await requireUser(req);
    if (error) return error;
    // Rate-limit per user: 5 changes per 15 minutes. Mitigates any
    // account-takeover scenario where an attacker with a stolen session
    // tries to cycle the password rapidly.
    if (!rateLimit(`pw-change:${me!.sub}`, 5, 15 * 60_000)) {
      return NextResponse.json(
        { error: 'Too many password changes. Please wait before trying again.' },
        { status: 429 },
      );
    }
    await connectDB();
    const body = await readBody(req, Body);
    const user = await User.findById(me.sub);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const ok = bcrypt.compareSync(body.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    // Reuse guard: reject the current password or any of the last 3.
    const history: string[] = (user as any).passwordHistory || [];
    if (isPasswordReused(body.newPassword, user.passwordHash, history)) {
      return NextResponse.json({ error: PASSWORD_REUSE_MESSAGE }, { status: 400 });
    }

    const newHash = bcrypt.hashSync(body.newPassword, 10);
    (user as any).passwordHistory = pushPasswordHistory(user.passwordHash, history);
    user.passwordHash = newHash;
    await user.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
