import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import UserNote from '@/models/UserNote';
import { requireUser } from '@/lib/auth';
import { handleError, readBody } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serialize(n: any) {
  return {
    id: String(n._id),
    title: n.title || null,
    content: n.content,
    type: n.type,
    whiteboardData: n.whiteboardData || null,
    pinned: !!n.pinned,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

const PatchBody = z
  .object({
    title: z.string().trim().max(200).optional(),
    content: z.string().trim().min(1).max(50000).optional(),
    pinned: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, PatchBody);
    const note = await UserNote.findOneAndUpdate(
      { _id: params.id, userId: user.sub },
      { $set: body },
      { new: true },
    ).lean();
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serialize(note));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    await UserNote.findOneAndDelete({ _id: params.id, userId: user.sub });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
