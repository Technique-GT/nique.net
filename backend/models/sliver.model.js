const mongoose = require('mongoose');

const SLIVER_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const sliverSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + SLIVER_TTL_SECONDS * 1000),
        // index: true,
    }
}, { timestamps: true });

sliverSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Sliver', sliverSchema);