import mongoose, { Schema, Model } from 'mongoose';

const PasswordResetSchema = new Schema({
  email:     { type: String, required: true, lowercase: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
  createdAt: { type: Date,   default: Date.now },
});

// MongoDB auto-deletes documents 2 hours after expiresAt
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7200 });

export const PasswordReset: Model<any> =
  (mongoose.models.PasswordReset as Model<any>) ||
  mongoose.model('PasswordReset', PasswordResetSchema);
