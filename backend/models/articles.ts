import mongoose, { Document, Schema, Model } from "mongoose";

enum Category {
  NEWS = "News",
  LIFE = "Life",
  OPINIONS = "Opinions",
  ENTERTAINMENT = "Entertainment",
  SPORTS = "Sports"
}

interface IArticle extends Document {
  _id: mongoose.Types.ObjectId; //mongoDB unique id
  title: string;
  slug: string;
  content: string;
  authors: mongoose.Types.ObjectId[];
  category: Category;
  tags: string[];
  publishedDate: Date;
  isPublished: boolean;
  imageUrl: string;
  imageCaption?: string;
  imageCredit?: string;
  isFeatured: boolean;
}

const articleSchema = new Schema<IArticle>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    authors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    category: {
      type: String,
      enum: Object.values(Category),
      required: true,
    },
    tags: {
      type: [String],
      default: [],
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
    imageCaption: {
      type: String,
    },
    imageCredit: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


const Article: Model<IArticle> = mongoose.model<IArticle>("Article", articleSchema);

export default Article;
