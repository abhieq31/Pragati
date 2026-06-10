import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { buildDailyBrief } from '@/lib/brief';
import { polishHeadline } from '@/lib/ai/briefPolish';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/me/brief — the viewer's Daily Brief (see src/lib/brief.ts).
 * Always scoped to the caller; there is no way to request someone else's.
 */
export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    const brief = await buildDailyBrief(user!.sub, user!.role);
    // Optional AI flavour: rephrase (never re-decide) the headline. Cached
    // once per user per day; instant no-op without GEMINI_API_KEY.
    brief.headline = await polishHeadline(user!.sub, brief);
    return NextResponse.json(brief, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return handleError(e);
  }
}
