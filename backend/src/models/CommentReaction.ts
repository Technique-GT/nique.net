import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentReaction extends Document {
  commentId: mongoose.Types.ObjectId;
  deviceId: string;
  reaction: 'up' | 'down';
  createdAt: Date;
  updatedAt: Date;
}

const CommentReactionSchema = new Schema<ICommentReaction>(
  {
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    deviceId: { type: String, required: true, trim: true },
    reaction: { type: String, enum: ['up', 'down'], required: true },
  },
  { timestamps: true },
);

CommentReactionSchema.index({ commentId: 1, deviceId: 1 }, { unique: true });

export default mongoose.model<ICommentReaction>('CommentReaction', CommentReactionSchema);
