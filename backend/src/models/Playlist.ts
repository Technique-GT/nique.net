import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description: string;
  spotifyUrl: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Playlist name is required'],
    trim: true,
    maxlength: [100, 'Playlist name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  spotifyUrl: {
    type: String,
    required: [true, 'Spotify URL is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/(open\.spotify\.com\/playlist\/|spotify:playlist:)/.test(v);
      },
      message: 'Please provide a valid Spotify playlist URL'
    }
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one active playlist at a time
PlaylistSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('Playlist').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

export default mongoose.model<IPlaylist>('Playlist', PlaylistSchema);