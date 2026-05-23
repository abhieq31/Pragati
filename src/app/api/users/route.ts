import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { requireUser, requireRole } from '@/lib/auth';
import { u } from '@/lib/serialize';
import { handleError, readBody } from '@/lib/http';
import { UsernameSchema } from '@/lib/validations';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (error) return error;
    await connectDB();

    // Optional ?teamId=... narrows the listing to members + lead of that
    // single team. Used by the project task-assignee dropdown so leads
    // only see people who actually belong to the project's team.
    const teamId = req.nextUrl.searchParams.get('teamId');
    let filter: any = {};
    if (teamId) {
      const team = await Team.findById(teamId).select('leadId memberIds').lean();
      if (team) {
        const ids = [team.leadId, ...(team.memberIds || [])].filter(Boolean);
        filter = { _id: { $in: ids } };
      } else {
        return NextResponse.json([]);
      }
    }

    const list = await User.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(list.map(u));
  } catch (e) {
    return handleError(e);
  }
}

const CreateBody = z.object({
  name:     z.string().min(1).max(120),
  // Username is the Instagram-style login handle and the primary identifier.
  username: UsernameSchema,
  // Email kept optional for legacy reasons (audit trail, future SSO) but
  // no longer required — leads sign in with their username.
  email:    z.string().email().optional(),
  title:    z.string().max(120).optional(),
  // role is intentionally excluded — all new accounts are IC.
  // Promotion to PM requires a separate explicit PATCH action.
});

function generateTempPassword(): string {
  // Format: Pragati-XXXXXX (8 random alphanumeric chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const rand = crypto.randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i++) suffix += chars[rand[i] % chars.length];
  return `Pragati-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireRole(req, 'pm', 'lead', 'admin');
    if (error) return error;
    await connectDB();
    const body = await readBody(req, CreateBody);

    // Reject duplicates on either column the user will use to sign in.
    const username = body.username;                // already lowercased + trimmed
    const email    = body.email?.toLowerCase().trim()
                  // Email is optional; synthesise an internal placeholder so
                  // legacy code that still references `user.email` keeps
                  // working without a separate migration.
                  || `${username}@pragati.local`;

    const conflict = await User.findOne({ $or: [{ email }, { username }] }, '_id email username').lean();
    if (conflict) {
      const which = (conflict as any).username === username ? 'Username' : 'Email';
      return NextResponse.json({ error: `${which} already in use` }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const user = await User.create({
      email,
      username,
      name:               body.name,
      passwordHash:       bcrypt.hashSync(tempPassword, 10),
      role:               'employee',
      title:              body.title || '',
      mustChangePassword: true,
    });
    return NextResponse.json({ user: u(user), tempPassword });
  } catch (e) {
    return handleError(e);
  }
}
