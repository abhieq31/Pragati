import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { PasswordReset } from '@/models/PasswordReset';
import { readBody, handleError } from '@/lib/http';

export const runtime = 'nodejs';

const Body = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, newPassword } = await readBody(req, Body);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await PasswordReset.findOne({ tokenHash, used: false });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const user = await User.findOne({ email: record.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    record.used = true;
    await record.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
