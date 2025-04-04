const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true }, // Stores rich text from Quill editor
    media: [{ 
        url: { type: String, required: true },
        caption: { type: String }
    }], // Stores multiple media items with captions
    featuredImage: { 
        url: { type: String, required: true },
        caption: { type: String }
    }, // Main image for the article
    authors: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }], // Supports multiple authors
    authorOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Drag-and-drop ordering of authors
    commentsEnabled: { type: Boolean, default: true }, // Enables/disables comments
    categories: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category' 
    }], // Multiple categories can be selected
    tags: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Tag' 
    }], // Multiple tags
    lastModified: { type: Date, default: Date.now } // Tracks the last modification time
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
