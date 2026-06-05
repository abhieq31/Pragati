import mongoose, { Schema } from 'mongoose';

const UserNoteSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    type:    { type: String, enum: ['text', 'whiteboard'], default: 'text' },
    /** Stored only for whiteboard-type notes — the raw stroke list. */
    whiteboardData: { type: Schema.Types.Mixed },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.UserNote || mongoose.model('UserNote', UserNoteSchema);
