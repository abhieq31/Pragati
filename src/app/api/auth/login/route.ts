import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken, setAuthCookie, isLead, isAdmin, configuredAdminEmail } from '@/lib/auth';
import { readBody, handleError } from '@/lib/http';
import { u } from '@/lib/serialize';

export const runtime = 'nodejs';

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await readBody(req, Body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const ok = bcrypt.compareSync(body.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // The configured ADMIN_EMAIL is auto-promoted on every successful login,
    // so an existing lead account whose email matches becomes the admin
    // without any manual SQL.
    const adminEmail = configuredAdminEmail();
    if (adminEmail && user.email === adminEmail && user.role !== 'admin') {
      user.role = 'admin' as any;
      await user.save();
    }

    // Pragati is leads + the single admin only. Contributors are tracked as
    // assignable records but cannot sign in.
    if (!isLead(user.role) && !isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'This workspace is open to team leads only. Contact your administrator.' },
        { status: 403 },
      );
    }

    const token = signToken({
      sub: String(user._id),
      email: user.email,
      role: user.role as any,
      name: user.name,
      title: user.title || '',
    });

    const res = NextResponse.json({ token, user: u(user) });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    return handleError(e);
  }
}
