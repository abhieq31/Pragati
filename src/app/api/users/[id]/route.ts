import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';
import { u } from '@/lib/serialize';

export const runtime = 'nodejs';

const Patch = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['member', 'manager', 'admin']).optional(),
  reportsToId: z.string().nullable().optional()
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const user = await User.findById(params.id).lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(u(user));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user: me } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, Patch);
    // Authorization:
    //   - admins can change anything (role, reporting line, name, title)
    //   - managers can change others' name, title, reportsToId (but not role)
    //   - members can only change their own name/title (not role or reportsTo)
    const isSelf = me.sub === params.id;
    if (body.role && me.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
    }
    if (!isSelf && me.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (body.reportsToId !== undefined && me.role === 'member' && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const set: any = {};
    for (const [k, v] of Object.entries(body)) if (v !== undefined) set[k] = v;
    await User.updateOne({ _id: params.id }, { $set: set });
    const fresh = await User.findById(params.id).lean();
    return NextResponse.json(u(fresh));
  } catch (e) {
    return handleError(e);
  }
}
