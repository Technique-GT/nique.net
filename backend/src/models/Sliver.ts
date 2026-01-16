import mongoose, { Document, Schema } from 'mongoose';

const SLIVER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface ISliver extends Document {
  text: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SliverSchema = new Schema<ISliver>(
  {
    text: { type: String, required: true, trim: true },
    // Canonical contract allows null, but product decision says it must always expire.
    // Enforce non-null on create/update.
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

SliverSchema.pre('validate', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + SLIVER_TTL_MS);
  }
  next();
});

// TTL index: delete at expiresAt
SliverSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISliver>('Sliver', SliverSchema);
