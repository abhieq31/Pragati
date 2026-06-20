import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models/Ticket';
import { requireUser } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError, readBody } from '@/lib/http';
import { TicketCreateSchema } from '@/lib/validations';
import { serializeTicket } from '@/lib/tickets';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

// Tickets live inside a team's Tickets module; every read/write is gated by
// team membership. Any member may file or update a ticket (it's a shared queue).
export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const teamId = req.nextUrl.searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    const denied = await guardTeamMember(teamId, String(user.sub), user.role);
    if (denied) return denied;
    const tickets = await Ticket.find({ teamId }).sort({ updatedAt: -1 }).limit(500);
    return NextResponse.json(tickets.map((t) => serializeTicket(t)));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const body = await readBody(req, TicketCreateSchema);
    const denied = await guardTeamMember(body.teamId, String(user.sub), user.role);
    if (denied) return denied;

    // Per-team sequential number — find the current max for this team and add 1.
    const last = await Ticket.findOne({ teamId: body.teamId }).sort({ number: -1 }).select('number').lean();
    const number = ((last as any)?.number || 0) + 1;

    const ticket = await Ticket.create({
      teamId: body.teamId,
      number,
      title: body.title,
      description: body.description || '',
      requesterName: body.requesterName || '',
      assigneeId: body.assigneeId || null,
      priority: body.priority || 'medium',
      category: body.category || '',
      createdBy: user.sub,
      createdByName: user.name || '',
    });
    await logOperation({
      action: 'ticket.create',
      category: 'general',
      actor: user,
      targetType: 'ticket',
      targetId: String(ticket._id),
      targetLabel: `#${number} ${ticket.title}`,
      summary: `Filed ticket #${number}: ${ticket.title}`,
      meta: { teamId: body.teamId },
    });
    return NextResponse.json(serializeTicket(ticket), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
