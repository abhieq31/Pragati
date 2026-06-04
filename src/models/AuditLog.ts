import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

// Append-only operational audit trail (21 CFR Part 11 §11.10(e): record who did
// what, when). Records are never updated or deleted by the application — there
// is no PATCH/DELETE path. Each entry captures the actor, the action, the
// affected record, and a human-readable summary.
const AuditLogSchema = new Schema(
  {
    // Dotted action key, e.g. 'project.create', 'task.status', 'user.reset'.
    action:   { type: String, required: true },
    // Coarse grouping for filtering in the UI.
    category: { type: String, enum: ['project', 'task', 'team', 'user', 'auth', 'general'], default: 'general' },

    actorId:   { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: '' },

    // What the action acted on (for linking + context).
    targetType:  { type: String, default: '' },   // 'project' | 'task' | 'team' | 'user'
    targetId:    { type: String, default: '' },
    targetLabel: { type: String, default: '' },    // human label, e.g. project name

    summary: { type: String, default: '' },        // one-line description
    meta:    { type: Schema.Types.Mixed, default: null }, // optional before/after, ids, etc.
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
// Drill-down by record — the audit page filters AuditLog.find({ targetId })
// (see /api/audit/route.ts). Without this, a per-project/per-task audit view
// is a full collection scan, which degrades as the trail grows (and a GxP
// audit trail only ever grows — it's never pruned). Compound with createdAt
// so the common "this record's history, newest first" query is fully indexed.
AuditLogSchema.index({ targetId: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & { _id: mongoose.Types.ObjectId };

export const AuditLog: Model<AuditLogDoc> =
  (mongoose.models.AuditLog as Model<AuditLogDoc>) ||
  mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);
