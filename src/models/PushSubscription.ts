import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

/**
 * One browser's Web Push subscription. Push is the zero-cost notification
 * channel: VAPID-signed messages go straight to the browser vendor's push
 * service — no provider, no quota, no bill, at any scale. A user can hold
 * several (laptop + phone); dead endpoints are pruned on 404/410 at send time.
 */
const PushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
);

PushSubscriptionSchema.index({ userId: 1 });

export type PushSubscriptionDoc = InferSchemaType<typeof PushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PushSubscription: Model<PushSubscriptionDoc> =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDoc>) ||
  mongoose.model<PushSubscriptionDoc>('PushSubscription', PushSubscriptionSchema);
