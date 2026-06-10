import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const WfPhaseSchema = new Schema(
  {
    name: { type: String, required: true },
    tasks: [{ title: String, type: String }],
  },
  { _id: false },
);

const WorkflowTemplateSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    phases: [WfPhaseSchema],
  },
  { timestamps: true },
);

WorkflowTemplateSchema.index({ createdBy: 1, createdAt: -1 });

export type WorkflowTemplateDoc = InferSchemaType<typeof WorkflowTemplateSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const WorkflowTemplate: Model<WorkflowTemplateDoc> =
  (mongoose.models.WorkflowTemplate as Model<WorkflowTemplateDoc>) ||
  mongoose.model<WorkflowTemplateDoc>('WorkflowTemplate', WorkflowTemplateSchema);
