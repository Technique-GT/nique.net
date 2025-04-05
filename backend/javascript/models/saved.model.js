const mongoose = require('mongoose');

const savedArticleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  }
}, {
  timestamps: true
});

// Ensure each user can only save an article once
savedArticleSchema.index({ user: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('SavedArticle', savedArticleSchema);