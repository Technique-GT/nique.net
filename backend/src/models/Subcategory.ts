import mongoose, { Document, Schema } from 'mongoose';

export interface ISubcategory extends Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const SubcategorySchema = new Schema<ISubcategory>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: false,
  },
);

SubcategorySchema.index({ categoryId: 1 });

SubcategorySchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

export default mongoose.model<ISubcategory>('SubCategory', SubcategorySchema);
