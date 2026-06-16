import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { requireUser } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError } from '@/lib/http';
import { buildTeamTicketRollup, rollupForWire } from '@/lib/ticketRollup';

export const runtime = 'nodejs';

// GET /api/teams/[id]/tickets — every tracking project's daily summary plus one
// combined team-wide backlog trend. Members, the team lead, and admins only.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const denied = await guardTeamMember(params.id, user!.sub, user!.role);
    if (denied) return denied;

    // Tracking, non-personal projects on this team.
    const projects = await Project.find({
      teamId: params.id,
      trackTickets: true,
      $and: [
        { $or: [{ isPersonal: { $ne: true } }, { isPersonal: { $exists: false } }] },
        { $or: [{ code: { $not: /^PRSN-/ } }, { code: { $exists: false } }] },
      ],
    })
      .select('code ccNo name ticketLabel')
      .lean();

    const rollup = await buildTeamTicketRollup(projects as any[]);
    return NextResponse.json({
      trackingProjects: projects.length,
      totalOpen: rollup.totalOpen,
      combined: rollup.combined,
      projects: rollup.projects.map(rollupForWire),
    });
  } catch (e) {
    return handleError(e);
  }
}
