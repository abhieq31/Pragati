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
    id:             String(n._id),
    title:          n.title || null,
    content:        n.content,
    type:           n.type,
    whiteboardData: n.whiteboardData || null,
    pinned:         !!n.pinned,
    createdAt:      n.createdAt,
    updatedAt:      n.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const notes = await UserNote.find({ userId: user.sub })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json(notes.map(serialize));
  } catch (e) {
    return handleError(e);
  }
}

const CreateBody = z.object({
  title:          z.string().trim().max(200).optional(),
  content:        z.string().trim().min(1).max(50000),
  type:           z.enum(['text', 'whiteboard']).default('text'),
  whiteboardData: z.any().optional(),
  pinned:         z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, CreateBody);
    const note = await UserNote.create({ userId: user.sub, ...body });
    return NextResponse.json(serialize(note));
  } catch (e) {
    return handleError(e);
  }
}
