const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Unique tag name
    slug: { type: String, required: true, unique: true }, // URL-friendly slug (e.g., "college-life", "football")
    createdAt: { type: Date, default: Date.now } // Timestamp for when the tag was created
});

module.exports = mongoose.model('Tag', tagSchema);
