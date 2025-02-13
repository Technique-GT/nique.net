import mongoose, { Document, Schema, Model } from "mongoose";

interface IComment extends Document {
    article: mongoose.Types.ObjectId; // article schema /articles.ts
    user: mongoose.Types.ObjectId; // user schema /users.ts
    content: string;
    createdAt: Date;
  }
  
  const commentSchema = new Schema<IComment>({
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Comment: Model<IComment> = mongoose.model<IComment>("Comment", commentSchema);
  