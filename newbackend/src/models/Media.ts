import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  url: string;
  altText: string;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    altText: {
      type: String,
      required: true,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: false,
  },
);

export default mongoose.model<IMedia>('Media', MediaSchema);
