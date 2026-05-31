import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

// Lightweight production error capture for admin monitoring. Both server-side
// API failures (via handleError) and client-side route-render crashes (via the
// error boundary reporting to /api/errors) land here, so an admin can see what
// users are actually hitting in production without trawling server logs.
//
// Records auto-expire after 30 days (TTL index) — this is operational
// telemetry, not a GxP audit record, so it is intentionally ephemeral and
// separate from the append-only AuditLog.
const ErrorLogSchema = new Schema(
  {
    source:     { type: String, enum: ['server', 'client'], default: 'server' },
    message:    { type: String, required: true },
    stack:      { type: String, default: '' },
    digest:     { type: String, default: '' },   // Next.js error digest, when present
    path:       { type: String, default: '' },   // route / pathname the user was on
    method:     { type: String, default: '' },   // HTTP method for server errors
    statusCode: { type: Number, default: 500 },

    // Best-effort actor context (may be absent for unauthenticated hits).
    userId:   { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' },

    // How many times this same signature has been seen (rolled up by message).
    count:        { type: Number, default: 1 },
    lastSeenAt:   { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ErrorLogSchema.index({ createdAt: -1 });
ErrorLogSchema.index({ acknowledged: 1, lastSeenAt: -1 });
// Auto-purge after 30 days.
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type ErrorLogDoc = InferSchemaType<typeof ErrorLogSchema> & { _id: mongoose.Types.ObjectId };

export const ErrorLog: Model<ErrorLogDoc> =
  (mongoose.models.ErrorLog as Model<ErrorLogDoc>) ||
  mongoose.model<ErrorLogDoc>('ErrorLog', ErrorLogSchema);
