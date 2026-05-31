import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

// A single-use, time-limited invitation to create a lead account. Created
// by an existing lead from the profile menu; consumed when the invitee
// completes /signup?token=…
//
// Audit fields (invitedBy, invitedByName, consumedAt, consumedByUserId) are
// retained for 21 CFR Part 11 §11.10(d) — we keep a permanent trail of who
// authorised whom into the system.
const InviteSchema = new Schema(
  {
    token:            { type: String, required: true, unique: true, index: true },
    email:            { type: String, required: true, lowercase: true, index: true },
    invitedBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedByName:    { type: String, default: '' },
    expiresAt:        { type: Date,   required: true },
    consumedAt:       { type: Date,   default: null },
    consumedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt:        { type: Date,   default: null },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically deletes expired invites at the DB level,
// keeping the collection lean without application-level cleanup jobs.
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type InviteDoc = InferSchemaType<typeof InviteSchema> & { _id: mongoose.Types.ObjectId };

export const Invite: Model<InviteDoc> =
  (mongoose.models.Invite as Model<InviteDoc>) ||
  mongoose.model<InviteDoc>('Invite', InviteSchema);
