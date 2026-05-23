import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { getLeadDashboardData } from '@/lib/leadDashboard';

export const runtime = 'nodejs';

// Single endpoint that backs the entire lead dashboard.
//
// Visibility is strict per lead:
//   • projects   — owned by the lead OR assigned to a team they lead or belong to.
//   • tasks      — assigned to the lead.
//   • people     — members of the team(s) the lead leads/belongs to, incl.
//                  the lead themselves.
//
// The real work lives in src/lib/leadDashboard.ts so the server-rendered
// dashboard page can call it directly without an extra HTTP round-trip.
export async function GET(req: NextRequest) {
  try {
    const { user: jwtUser, error } = await requireUser(req);
    if (error) return error;

    const data = await getLeadDashboardData(jwtUser);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=60' },
    });
  } catch (e) {
    return handleError(e);
  }
}
