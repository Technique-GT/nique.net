const mongoose = require('mongoose');

const dashboardSettingsSchema = new mongoose.Schema({
  stickyArticles: [{
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article'
    },
    position: Number,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  }],
  featuredArticles: [{
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article'
    },
    position: Number
  }],
  publicationSchedule: {
    type: String,
    trim: true
  },
  footerContent: {
    type: String,
    trim: true
  },
  spotifyPlaylist: {
    type: String,
    trim: true
  },
  gameScores: [{
    sport: String,
    homeTeam: String,
    awayTeam: String,
    homeScore: Number,
    awayScore: Number,
    isLive: Boolean,
    lastUpdated: Date
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DashboardSettings', dashboardSettingsSchema);