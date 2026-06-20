import type { TicketDoc } from '@/models/Ticket';

/** Shape a ticket for the client. */
export function serializeTicket(doc: TicketDoc) {
  const t = doc as any;
  return {
    id: String(t._id),
    teamId: String(t.teamId),
    number: t.number,
    title: t.title,
    description: t.description || '',
    requesterName: t.requesterName || '',
    assigneeId: t.assigneeId ? String(t.assigneeId) : null,
    priority: t.priority,
    status: t.status,
    category: t.category || '',
    resolvedAt: t.resolvedAt ? new Date(t.resolvedAt).toISOString() : null,
    createdByName: t.createdByName || '',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
    comments: (t.comments || []).map((c: any) => ({
      id: String(c._id),
      userId: c.userId ? String(c.userId) : null,
      userName: c.userName || '',
      body: c.body,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
    })),
  };
}

export type SerializedTicket = ReturnType<typeof serializeTicket>;
