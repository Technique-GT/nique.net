import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  articleId: mongoose.Types.ObjectId;
  parentCommentId?: mongoose.Types.ObjectId;
  content: string;
  username: string;
  thumbsUp: number;
  thumbsDown: number;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      required: false,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    thumbsUp: {
      type: Number,
      required: true,
      default: 0,
    },
    thumbsDown: {
      type: Number,
      required: true,
      default: 0,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

CommentSchema.index({ articleId: 1, createdAt: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
