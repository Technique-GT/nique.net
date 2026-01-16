import mongoose, { Schema, Document } from 'mongoose';

export interface ICollaborator extends Document {
  name: string;
  title: string;
  email?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  status: 'active' | 'inactive';
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // This allows multiple null values
    validate: {
      validator: function(v: string) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String
  },
  socialLinks: [{
    platform: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove any compound index that includes email and userId
// Only keep these simple indexes:

// Index for name searches
CollaboratorSchema.index({ name: 1 });

// Index for status filtering
CollaboratorSchema.index({ status: 1 });

// Note: email path sets `sparse: true`, which already creates a sparse index
// No separate schema-level index needed to avoid duplicates

export default mongoose.model<ICollaborator>('Collaborator', CollaboratorSchema); 
