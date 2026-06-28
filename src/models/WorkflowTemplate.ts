import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

// NOTE: `type` is a reserved key in Mongoose. Declaring the task shape inline as
// `[{ title: String, type: String }]` makes Mongoose read the `type: String` as a
// SchemaType declaration and collapse the whole element into a plain `[String]`,
// which then throws a CastError when an array of `{ title }` objects is saved.
// Defining an explicit sub-schema keeps `title`/`type` as real object fields.
const WfTaskSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, default: '' },
  },
  { _id: false },
);

const WfPhaseSchema = new Schema(
  {
    name: { type: String, required: true },
    tasks: { type: [WfTaskSchema], default: [] },
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
