const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
}, { timestamps: true });

storySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);