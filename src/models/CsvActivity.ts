import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';
import { CSV_STAGE_KEYS, CSV_STAGE_STATUSES } from '@/lib/csvStages';

/**
 * CSV Activity sheet — a digital replacement for the Excel "CSV activity status"
 * sheet the IDP / CSV team maintains by hand. One document = one Change Control
 * (e.g. C/CC/PCC/2026/0765), holding a row per Format (e-logbook) being
 * validated. Each row carries the same six validation-document stages the
 * spreadsheet tracks (see src/lib/csvStages.ts), each with a document number,
 * approval date, and status.
 */

const StageCellSchema = new Schema(
  {
    key: { type: String, enum: CSV_STAGE_KEYS as unknown as string[], required: true },
    docNo: { type: String, default: '' },
    approvalDate: { type: Date, default: null },
    status: {
      type: String,
      enum: CSV_STAGE_STATUSES as unknown as string[],
      default: 'pending',
    },
  },
  { _id: false },
);

const RowSchema = new Schema(
  {
    formatNumber: { type: String, default: '' }, // e.g. "F4\QA\SOP\0004-F005"
    formatTitle: { type: String, default: '' },
    elogbookTitle: { type: String, default: '' },
    // Physical sites/blocks the format applies to, e.g. "F4" or "A1, A2, A3".
    // Free text on purpose — sites are named differently across plants.
    sites: { type: String, default: '' },
    stages: { type: [StageCellSchema], default: [] },
  },
  { _id: true, timestamps: true },
);

const CsvActivitySchema = new Schema(
  {
    changeControlNo: { type: String, required: true, maxlength: 120 }, // "C/CC/PCC/2026/0765"
    prNo: { type: String, default: '' }, // "108743"
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    rows: { type: [RowSchema], default: [] },
  },
  { timestamps: true },
);

CsvActivitySchema.index({ changeControlNo: 1 });
CsvActivitySchema.index({ createdAt: -1 });

export type CsvActivityDoc = InferSchemaType<typeof CsvActivitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CsvActivity: Model<CsvActivityDoc> =
  (mongoose.models.CsvActivity as Model<CsvActivityDoc>) ||
  mongoose.model<CsvActivityDoc>('CsvActivity', CsvActivitySchema);
