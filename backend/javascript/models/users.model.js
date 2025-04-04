const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    role: { 
        type: String, 
        enum: ['subscriber', 'editor', 'manager', 'admin'], 
        default: 'subscriber' 
    },
    category: { 
        type: String, 
        enum: ['technology', 'health', 'finance', 'education', 'entertainment', 'general'], 
        default: 'general' 
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
