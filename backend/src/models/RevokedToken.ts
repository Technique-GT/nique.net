import mongoose, { Document, Schema } from 'mongoose';

export interface IRevokedToken extends Document {
  tokenHash: string;
  userId?: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const RevokedTokenSchema = new Schema<IRevokedToken>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

// TTL index to remove expired revoked tokens automatically
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRevokedToken>('RevokedToken', RevokedTokenSchema);
