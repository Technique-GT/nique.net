import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaAsset extends Document {
  key: string;
  fileName: string;
  fileNameLower: string;
  url: string;
  contentType?: string;
  size: number;
  etag?: string;
  lastModified?: Date;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileNameLower: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    contentType: { type: String, required: false, trim: true },
    size: { type: Number, required: true, default: 0 },
    etag: { type: String, required: false, trim: true },
    lastModified: { type: Date, required: false },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  },
);

MediaAssetSchema.index({ uploadedAt: -1, _id: -1 });
MediaAssetSchema.index({ lastModified: -1, _id: -1 });
MediaAssetSchema.index({ size: -1, _id: -1 });
MediaAssetSchema.index({ fileNameLower: 1 });

export default mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
