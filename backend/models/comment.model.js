const mongoose = require('mongoose');

const DEFAULT_AVATAR =
  'https://www.gravatar.com/avatar/?d=mp&f=y';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
    author: {
      name: {
        type: String,
        trim: true,
        required: true,
      },
      avatar: {
        type: String,
        trim: true,
        default: DEFAULT_AVATAR,
      },
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    thumbsUp: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbsDown: {
      type: Number,
      default: 0,
      min: 0,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isSpam: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Comment', commentSchema);
