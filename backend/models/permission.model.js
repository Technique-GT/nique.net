const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['subscriber', 'editor', 'manager', 'admin'],
    required: true,
    unique: true
  },
  permissions: {
    createArticle: Boolean,
    editOwnArticle: Boolean,
    editAnyArticle: Boolean,
    deleteOwnArticle: Boolean,
    deleteAnyArticle: Boolean,
    publishArticle: Boolean,
    manageCategories: Boolean,
    manageTags: Boolean,
    manageMedia: Boolean,
    manageComments: Boolean,
    manageUsers: Boolean,
    managePermissions: Boolean,
    accessDashboard: Boolean,
    viewAnalytics: Boolean
  }
});

module.exports = mongoose.model('Permission', permissionSchema);