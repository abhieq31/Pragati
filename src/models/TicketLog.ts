import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

/**
 * A single day's support-ticket reading for a project that has ticket tracking
 * switched on (Project.trackTickets). The Quality team logs these in their
 * daily stand-up; management reads the rolled-up count in reports and the
 * morning brief.
 *
 * One canonical row per project per local day (workspace timezone) — re-logging
 * the same day upserts the row rather than appending, so the series is a clean
 * one-point-per-day time series the analytics in lib/tickets.ts can trust.
 */
const TicketLogSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    // Denormalized from the project so team-wide rollups (team report, digest)
    // never need a project join just to filter by team.
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    // Local calendar day, YYYY-MM-DD, in the workspace timezone (digestTimeZone).
    // This — not a Date — is the natural key for a "one reading per day" series,
    // and side-steps every off-by-one a UTC Date would cause around midnight.
    dateKey: { type: String, required: true },
    // The three numbers a support desk reports. All default 0 and are clamped
    // non-negative; only `open` is required from the UI.
    open: { type: Number, default: 0, min: 0 }, // backlog still open at log time (the headline count)
    logged: { type: Number, default: 0, min: 0 }, // new tickets logged that day (inflow)
    resolved: { type: Number, default: 0, min: 0 }, // tickets resolved that day (throughput)
    note: { type: String, default: '', maxlength: 500 },
    loggedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// At-most-one reading per project per day, and the hot read path for a
// project's recent series (sorted by dateKey).
TicketLogSchema.index({ projectId: 1, dateKey: 1 }, { unique: true });
// Team-wide daily rollups for the team report and the leadership digest.
TicketLogSchema.index({ teamId: 1, dateKey: 1 });

export type TicketLogDoc = InferSchemaType<typeof TicketLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TicketLog: Model<TicketLogDoc> =
  (mongoose.models.TicketLog as Model<TicketLogDoc>) ||
  mongoose.model<TicketLogDoc>('TicketLog', TicketLogSchema);
