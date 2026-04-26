import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { readBody, handleError } from '@/lib/http';

export const runtime = 'nodejs';

const Body = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  try {
    const { user: me, error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, Body);
    const user = await User.findById(me.sub);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const ok = bcrypt.compareSync(body.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    user.passwordHash = bcrypt.hashSync(body.newPassword, 10);
    await user.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
