import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

/**
 * Operations / audit log. An append-only record of who did what, when —
 * the system never updates or deletes entries, satisfying the 21 CFR
 * Part 11 §11.10(e) requirement for a secure, time-stamped audit trail of
 * record-changing operations. Surfaced to the workspace admin in the
 * People (admin) area.
 *
 * `summary` is a human-readable one-liner; `meta` holds any structured
 * before/after detail. `actorName` is denormalised so the log stays
 * readable even if the actor is later renamed or removed.
 */
const AuditLogSchema = new Schema(
  {
    actorId:    { type: Schema.Types.ObjectId, ref: 'User' },
    actorName:  { type: String, default: '' },
    actorRole:  { type: String, default: '' },
    action:     { type: String, required: true },   // e.g. 'user.lock', 'project.delete'
    entityType: { type: String, default: '' },       // 'user' | 'project' | 'team' | 'auth' | ...
    entityId:   { type: String, default: '' },
    summary:    { type: String, required: true },
    meta:       { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Newest-first listing, plus an action filter.
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & { _id: mongoose.Types.ObjectId };

export const AuditLog: Model<AuditLogDoc> =
  (mongoose.models.AuditLog as Model<AuditLogDoc>) ||
  mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);
