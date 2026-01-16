import mongoose, { Document, Schema } from 'mongoose';

export type SocialLink = {
  platform: string;
  url: string;
};

export interface IUser extends Document {
  name: string;
  bio?: string;
  isAdmin: boolean;
  profilePictureMediaId?: mongoose.Types.ObjectId;
  socialLinks: SocialLink[];
}

const SocialLinkSchema = new Schema<SocialLink>(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: false },
    isAdmin: { type: Boolean, required: true, default: false },
    profilePictureMediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: false },
    socialLinks: { type: [SocialLinkSchema], required: true, default: [] },
  },
  {
    timestamps: false,
  },
);

export default mongoose.model<IUser>('User', UserSchema);
