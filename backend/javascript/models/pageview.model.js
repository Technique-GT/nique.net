const mongoose = require('mongoose');

const pageviewSchema = new mongoose.Schema({
    pageUrl: { type: String, required: true }, // The URL of the page viewed
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user who viewed the page (optional)
    sessionId: { type: String, required: true }, // The session in which the page was viewed
    timestamp: { type: Date, default: Date.now }, // Timestamp when the page was viewed
    referrer: { type: String }, // The page the user came from (optional)
    device: { type: String }, // The device the user used to view the page (optional)
    browser: { type: String }, // The browser the user used (optional)
    duration: { type: Number }, // Time spent on the page in seconds
});

module.exports = mongoose.model('Pageview', pageviewSchema);
