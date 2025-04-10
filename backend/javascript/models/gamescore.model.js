const mongoose = require('mongoose');

const gameScoreSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['football', 'basketball', 'baseball', 'soccer', 'hockey', 'other']
  },
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  homeScore: {
    type: Number,
    default: 0
  },
  awayScore: {
    type: Number,
    default: 0
  },
  isLive: {
    type: Boolean,
    default: false
  },
  startTime: Date,
  endTime: Date,
  period: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameScore', gameScoreSchema);