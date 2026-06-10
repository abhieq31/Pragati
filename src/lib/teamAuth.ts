import { NextResponse } from 'next/server';
import { Team } from '@/models/Team';
import { isAdmin } from '@/lib/auth';

// A team may be modified (renamed, members changed, deleted) by any workspace
// lead or admin — not only the team's own lead. This gives team leaders the
// flexibility to manage cross-team collaboration without needing admin access.
// Returns null when allowed, or a 403/404 NextResponse when not. Callers must
// have already connected to the DB.
export async function guardTeamOwner(teamId: string, userId: string, role: string) {
  const t = await Team.findById(teamId).select('leadId').lean();
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (isAdmin(role) || role === 'lead') return null;
  return NextResponse.json({ error: 'Only a team lead or admin can change this team.' }, { status: 403 });
}

/**
 * Read-only membership gate. Returns null when the caller may VIEW the
 * team's content (board, members, projects), or a 403/404 when not. The
 * admin sees everything; the lead of the team sees it; an explicit member
 * of the team sees it; everyone else gets a clean refusal. Callers must
 * have already connected to the DB.
 */
export async function guardTeamMember(teamId: string, userId: string, role: string) {
  const t = await Team.findById(teamId).select('leadId memberIds').lean();
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (isAdmin(role)) return null;
  const ownerId = (t as any).leadId ? String((t as any).leadId) : null;
  if (ownerId === userId) return null;
  const isMember = ((t as any).memberIds || []).some((m: any) => String(m) === userId);
  if (isMember) return null;
  return NextResponse.json({ error: 'You do not have access to this team.' }, { status: 403 });
}
