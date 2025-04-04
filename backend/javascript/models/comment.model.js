const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true }, // Links comment to an article
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links comment to a user
    content: { type: String, required: true }, // Stores the comment text
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'flagged', 'deleted'], 
        default: 'approved' 
    }, // Moderation status
    createdAt: { type: Date, default: Date.now }, // Timestamp for when the comment was created
    updatedAt: { type: Date }, // Timestamp for when the comment was edited
    edited: { type: Boolean, default: false }, // Tracks if comment was edited
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Allows nested replies
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the comment
    reports: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
        reason: { type: String } 
    }] // Tracks reports for moderation
});

module.exports = mongoose.model('Comment', commentSchema);
