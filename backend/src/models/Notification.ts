import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: 'review_requested' | 'changes_requested' | 'published' | 'comment' | 'system';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['review_requested', 'changes_requested', 'published', 'comment', 'system'],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for fetching user's notifications (especially unread ones), sorted by date
NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
