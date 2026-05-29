import { NextResponse } from 'next/server';
import { Team } from '@/models/Team';
import { isAdmin } from '@/lib/auth';

// A team may only be modified (renamed, members changed, deleted) by the
// workspace admin or the team's own lead (its "owner"). Any other lead — even
// though they can lead their own teams — must not touch a team they don't own.
// Returns null when allowed, or a 403/404 NextResponse when not. Callers must
// have already connected to the DB.
export async function guardTeamOwner(teamId: string, userId: string, role: string) {
  const t = await Team.findById(teamId).select('leadId').lean();
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ownerId = (t as any).leadId ? String((t as any).leadId) : null;
  if (isAdmin(role) || (ownerId && ownerId === userId)) return null;
  return NextResponse.json(
    { error: 'Only the team owner or an admin can change this team.' },
    { status: 403 },
  );
}
