import mongoose, { Document, Schema } from 'mongoose';

export type AuthorRef = {
  authorId: mongoose.Types.ObjectId;
  order: number;
};

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;

  authors: AuthorRef[];
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  tagIds: mongoose.Types.ObjectId[];

  featuredMediaUrl?: string;
  imageCaption?: string;

  published: boolean;
  publishedAt: Date | null;

  allowComments: boolean;
  isFeatured: boolean;
  isSticky: boolean;

  ownerId: mongoose.Types.ObjectId;
  editorState?: any;
  reviewStatus: 'draft' | 'in_review' | 'changes_requested' | 'published';
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;

  viewCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const AuthorRefSchema = new Schema<AuthorRef>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, required: true },

    authors: { type: [AuthorRefSchema], required: true, default: [] },

    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: false },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: false },
    tagIds: { type: [Schema.Types.ObjectId], ref: 'Tag', required: true, default: [] },

    featuredMediaUrl: { type: String, required: false, trim: true },
    imageCaption: { type: String, required: false },

    published: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date, required: false, default: null },

    allowComments: { type: Boolean, required: true, default: true },
    isFeatured: { type: Boolean, required: true, default: false },
    isSticky: { type: Boolean, required: true, default: false },

    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    editorState: { type: Schema.Types.Mixed, required: false },
    reviewStatus: { 
      type: String, 
      enum: ['draft', 'in_review', 'changes_requested', 'published'], 
      required: true, 
      default: 'draft' 
    },
    reviewedAt: { type: Date, required: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    reviewNotes: { type: String, required: false },

    viewCount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Canonical indexes (kept in sync with audit script expectations)
ArticleSchema.index({ slug: 1 }, { unique: true });
ArticleSchema.index({ published: 1, publishedAt: -1 });
ArticleSchema.index({ 'authors.authorId': 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ categoryId: 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ isFeatured: 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ featuredMediaUrl: 1 }, { sparse: true });

export default mongoose.model<IArticle>('Article', ArticleSchema);
