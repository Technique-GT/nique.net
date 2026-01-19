import mongoose, { Document, Schema } from 'mongoose';

export type SocialLink = {
  platform: string;
  url: string;
};

export interface IUser extends Document {
  name: string;
  bio?: string;
  isAdmin: boolean;
  email?: string;
  googleSub?: string;
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
    email: { type: String, required: false, unique: true, sparse: true, lowercase: true, trim: true },
    googleSub: { type: String, required: false, unique: true, sparse: true, trim: true },
    profilePictureMediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: false },
    socialLinks: { type: [SocialLinkSchema], required: true, default: [] },
  },
  {
    timestamps: false,
  },
);

export default mongoose.model<IUser>('User', UserSchema);
