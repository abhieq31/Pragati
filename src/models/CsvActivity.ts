import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';
import { STAGE_STATUSES, DEFAULT_STAGES } from '@/lib/csvStages';

/**
 * Tracker sheet — the generic grid behind a team's quality / QMS module.
 *
 * One document = one tracked record (e.g. a change, a release, an onboarding,
 * an audit), holding a row per item being tracked. The *columns* (stages) are
 * defined per sheet (`stages`), so the same structure serves any team's
 * checklist or approval workflow — it isn't tied to any one team's process.
 * Each row carries a cell per stage with a reference, a date, and a status.
 */

// One configurable column. Keys are free-form (no fixed enum) so a team can
// shape the tracker to its own process.
const StageDefSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false },
);

const StageCellSchema = new Schema(
  {
    key: { type: String, required: true },
    ref: { type: String, default: '' }, // free-text reference (doc / ticket / link)
    date: { type: Date, default: null },
    status: {
      type: String,
      enum: STAGE_STATUSES as unknown as string[],
      default: 'pending',
    },
  },
  { _id: false },
);

const RowSchema = new Schema(
  {
    ref: { type: String, default: '' }, // the item's identifier / reference
    name: { type: String, default: '' }, // the item's title / description
    note: { type: String, default: '' }, // optional free-text tag / note
    stages: { type: [StageCellSchema], default: [] },
  },
  { _id: true, timestamps: true },
);

const CsvActivitySchema = new Schema(
  {
    // The team that owns this sheet — the tracker lives inside a team's QMS
    // module, gated by Team.modules.qms.enabled. Membership is the access
    // boundary (see guardTeamMember).
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    reference: { type: String, required: true, maxlength: 120 }, // primary record reference
    reference2: { type: String, default: '' }, // optional secondary reference
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    // The configurable columns for this sheet. Defaults to a neutral set.
    stages: { type: [StageDefSchema], default: () => DEFAULT_STAGES.map((s) => ({ ...s })) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    rows: { type: [RowSchema], default: [] },
  },
  { timestamps: true },
);

CsvActivitySchema.index({ teamId: 1, createdAt: -1 });
CsvActivitySchema.index({ reference: 1 });

export type CsvActivityDoc = InferSchemaType<typeof CsvActivitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CsvActivity: Model<CsvActivityDoc> =
  (mongoose.models.CsvActivity as Model<CsvActivityDoc>) ||
  mongoose.model<CsvActivityDoc>('CsvActivity', CsvActivitySchema);
