import mongoose, { Document, Schema, Model } from "mongoose";


interface IArticle extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId; 
  categories: string[]; 
  publishedDate: Date;
  isPublished: boolean; 
  imageUrl: string; 
}
const articleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User", // user model /users.ts
    required: true,
  },
  categories: {
    type: [String],
    required: true,
  },
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // auto create time fields 


const Article: Model<IArticle> = mongoose.model<IArticle>("Article", articleSchema);

export default Article;
