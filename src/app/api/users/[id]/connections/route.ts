import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIELDS = 'name username role avatarLetter avatarBg avatarFont avatarImage';

/**
 * GET /api/users/[id]/connections?rel=followers|following
 *
 * Lists the people who follow this user (rel=followers) or whom this user
 * follows (rel=following), with just enough to render a row + a follow-back
 * button. The workspace directory is open by design, so any signed-in member
 * can read either list. Each row carries `viewerIsFollowing` relative to the
 * requester so the button shows the right state.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user: me } = await requireUser(req);
    if (error) return error;
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }
    const rel = new URL(req.url).searchParams.get('rel') === 'following' ? 'following' : 'followers';
    await connectDB();

    let people: any[];
    if (rel === 'following') {
      const doc = await User.findById(params.id).select('following').lean();
      const ids = ((doc as any)?.following || []) as any[];
      people = ids.length
        ? await User.find({ _id: { $in: ids }, active: { $ne: false } })
            .select(FIELDS)
            .lean()
        : [];
    } else {
      people = await User.find({ following: params.id, active: { $ne: false } })
        .select(FIELDS)
        .lean();
    }

    // The viewer's own following set — drives each row's follow-back state.
    const meDoc = await User.findById(me!.sub).select('following').lean();
    const meFollowing = new Set(((meDoc as any)?.following || []).map((x: any) => String(x)));

    const users = people
      .map((p) => ({
        id: String(p._id),
        name: p.name,
        username: p.username || null,
        role: p.role || 'contributor',
        avatarLetter: p.avatarLetter || '',
        avatarBg: p.avatarBg || '',
        avatarFont: typeof p.avatarFont === 'number' ? p.avatarFont : 0,
        avatarImage: p.avatarImage || '',
        isSelf: String(p._id) === me!.sub,
        viewerIsFollowing: meFollowing.has(String(p._id)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ users });
  } catch (e) {
    return handleError(e);
  }
}
