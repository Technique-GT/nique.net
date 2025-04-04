const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: { type: String, required: true }, // Name of the file
    url: { type: String, required: true }, // URL to access the media file
    title: { type: String }, // Optional title for the media
    caption: { type: String }, // Optional caption for the media
    type: { type: String, enum: ['image', 'video', 'audio', 'other'], required: true }, // Type of media file
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who uploaded the media
    uploadedAt: { type: Date, default: Date.now }, // Timestamp for when the media was uploaded
    size: { type: Number }, // Size of the media file in bytes
});

module.exports = mongoose.model('Media', mediaSchema);
