const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Links session to a user
    sessionId: { type: String, required: true, unique: true }, // Unique session identifier
    ipAddress: { type: String }, // The IP address from which the user accessed the site
    device: { type: String }, // Optional field for storing device info (e.g., mobile, desktop)
    browser: { type: String }, // The browser the user is using (e.g., Chrome, Firefox)
    startTime: { type: Date, default: Date.now }, // Timestamp for when the session started
    endTime: { type: Date }, // Timestamp for when the session ended (if applicable)
    duration: { type: Number }, // Duration of the session in seconds
});

module.exports = mongoose.model('Session', sessionSchema);
