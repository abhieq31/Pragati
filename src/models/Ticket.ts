import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

/**
 * Support ticket — a lightweight internal request queue scoped to a team.
 * Lives inside a team's Tickets module (Team.modules.tickets.enabled). This is
 * deliberately minimal: a title, who's on it, a priority, and a status that
 * moves open → in_progress → waiting → resolved → closed. "Waiting since"
 * (derived from updatedAt while status==='waiting') is the one signal a queue
 * actually needs.
 */

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const CommentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' },
    body: { type: String, required: true, maxlength: 4000 },
  },
  { _id: true, timestamps: true },
);

const TicketSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    number: { type: Number, required: true }, // per-team sequential, e.g. #1, #2
    title: { type: String, required: true, maxlength: 300 },
    description: { type: String, default: '', maxlength: 8000 },
    requesterName: { type: String, default: '' }, // free text — the request may come from outside the app
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: String, enum: TICKET_PRIORITIES as unknown as string[], default: 'medium' },
    status: { type: String, enum: TICKET_STATUSES as unknown as string[], default: 'open' },
    category: { type: String, default: '' },
    comments: { type: [CommentSchema], default: [] },
    resolvedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true },
);

TicketSchema.index({ teamId: 1, status: 1, updatedAt: -1 });
TicketSchema.index({ teamId: 1, number: -1 });
TicketSchema.index({ assigneeId: 1, status: 1 });

export type TicketDoc = InferSchemaType<typeof TicketSchema> & { _id: mongoose.Types.ObjectId };

export const Ticket: Model<TicketDoc> =
  (mongoose.models.Ticket as Model<TicketDoc>) || mongoose.model<TicketDoc>('Ticket', TicketSchema);
