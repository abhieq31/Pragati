import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models/Ticket';
import { requireUser, isAdmin } from '@/lib/auth';
import { guardTeamMember } from '@/lib/teamAuth';
import { handleError, readBody } from '@/lib/http';
import { TicketUpdateSchema } from '@/lib/validations';
import { serializeTicket } from '@/lib/tickets';
import { logOperation } from '@/lib/audit';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const ticket = await Ticket.findById(params.id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    const denied = await guardTeamMember(String(ticket.teamId), String(user.sub), user.role);
    if (denied) return denied;

    const body = await readBody(req, TicketUpdateSchema);
    if (body.title !== undefined) ticket.title = body.title;
    if (body.description !== undefined) ticket.description = body.description;
    if (body.requesterName !== undefined) ticket.requesterName = body.requesterName;
    if (body.assigneeId !== undefined) ticket.assigneeId = (body.assigneeId || null) as any;
    if (body.priority !== undefined) ticket.priority = body.priority;
    if (body.category !== undefined) ticket.category = body.category;
    if (body.status !== undefined) {
      ticket.status = body.status;
      // Stamp/clear the resolution time so "resolved" surfaces are honest.
      ticket.resolvedAt = body.status === 'resolved' || body.status === 'closed' ? new Date() : null;
    }
    if (body.comment) {
      ticket.comments.push({
        userId: user.sub as any,
        userName: user.name || '',
        body: body.comment,
      } as any);
    }
    await ticket.save();

    await logOperation({
      action: 'ticket.update',
      category: 'general',
      actor: user,
      targetType: 'ticket',
      targetId: String(ticket._id),
      targetLabel: `#${ticket.number} ${ticket.title}`,
      summary: `Updated ticket #${ticket.number}`,
      meta: { teamId: String(ticket.teamId) },
    });
    return NextResponse.json(serializeTicket(ticket));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const ticket = await Ticket.findById(params.id).lean();
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    const denied = await guardTeamMember(String((ticket as any).teamId), String(user.sub), user.role);
    if (denied) return denied;
    // Only the filer, a lead, or an admin can delete a ticket.
    const isOwner = String((ticket as any).createdBy) === String(user.sub);
    if (!isOwner && !isAdmin(user.role) && user.role !== 'lead') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await Ticket.deleteOne({ _id: params.id });
    await logOperation({
      action: 'ticket.delete',
      category: 'general',
      actor: user,
      targetType: 'ticket',
      targetId: String(params.id),
      targetLabel: `#${(ticket as any).number} ${(ticket as any).title}`,
      summary: `Deleted ticket #${(ticket as any).number}`,
      meta: { teamId: String((ticket as any).teamId) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
