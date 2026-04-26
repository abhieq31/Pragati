import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { PasswordReset } from '@/models/PasswordReset';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { readBody, handleError } from '@/lib/http';

export const runtime = 'nodejs';

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await readBody(req, Body);

    // Always return 200 — never reveal whether email exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ ok: true });

    // Invalidate any previous unused tokens for this email
    await PasswordReset.updateMany({ email: email.toLowerCase(), used: false }, { used: true });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordReset.create({ email: email.toLowerCase(), tokenHash, expiresAt });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(email.toLowerCase(), resetUrl, user.name);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Don't leak SMTP errors to the client
    console.error('[forgot-password]', e.message);
    return NextResponse.json({ ok: true });
  }
}
