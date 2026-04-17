import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['member', 'manager', 'admin'],
      default: 'member'
    },
    title: { type: String, default: '' },
    // reportsToId makes an explicit manager-of chain so that the `/reportings`
    // page can aggregate progress upward. Purely additive — nobody has to set
    // it and the tool keeps working if it's not filled.
    reportsToId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>('User', UserSchema);
