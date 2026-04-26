import mongoose, { Schema, Model } from 'mongoose';

const PasswordResetSchema = new Schema({
  email:     { type: String, required: true, lowercase: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
});

export const PasswordReset: Model<any> =
  (mongoose.models.PasswordReset as Model<any>) ||
  mongoose.model('PasswordReset', PasswordResetSchema);
