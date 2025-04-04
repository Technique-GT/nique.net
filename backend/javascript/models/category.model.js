const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Unique category name
    description: { type: String }, // Short description of the category
    slug: { type: String, required: true, unique: true }, // URL-friendly slug (e.g., "news", "sports")
    createdAt: { type: Date, default: Date.now }, // Timestamp for when the category was created
    updatedAt: { type: Date } // Timestamp for when the category was last updated
});

module.exports = mongoose.model('Category', categorySchema);
