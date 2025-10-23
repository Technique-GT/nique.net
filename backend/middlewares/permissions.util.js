const Permission = require('../models/permission.model');

const defaultPermissions = {
  admin: {
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: true,
    deleteOwnArticle: true,
    deleteAnyArticle: true,
    publishArticle: true,
    manageCategories: true,
    manageTags: true,
    manageMedia: true,
    manageComments: true,
    manageUsers: true,
    managePermissions: true,
    accessDashboard: true,
    viewAnalytics: true,
    viewSliver: true,
    deleteSliver: true
  },
  manager: {
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: true,  // Only for their categories
    deleteOwnArticle: true,
    deleteAnyArticle: true,  // Only for their categories
    publishArticle: true,
    manageCategories: true,
    manageTags: true,
    manageMedia: true,
    manageComments: true,
    manageUsers: false,
    managePermissions: false,
    accessDashboard: true,
    viewAnalytics: true,
    viewSliver: true,
    deleteSliver: true
  },
  editor: {
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: false,
    deleteOwnArticle: true,
    deleteAnyArticle: false,
    publishArticle: false,
    manageCategories: false,
    manageTags: false,
    manageMedia: true,
    manageComments: false,
    manageUsers: false,
    managePermissions: false,
    accessDashboard: true,
    viewAnalytics: false,
    viewSliver: true,
    deleteSliver: true
  },
  subscriber: {
    createArticle: false,
    editOwnArticle: false,
    editAnyArticle: false,
    deleteOwnArticle: false,
    deleteAnyArticle: false,
    publishArticle: false,
    manageCategories: false,
    manageTags: false,
    manageMedia: false,
    manageComments: false,
    manageUsers: false,
    managePermissions: false,
    accessDashboard: false,
    viewAnalytics: false,
    viewSliver: false,
    deleteSliver: false
  },
  viewer: {
    createArticle: false,
    editOwnArticle: false,
    editAnyArticle: false,
    deleteOwnArticle: false,
    deleteAnyArticle: false,
    publishArticle: false,
    manageCategories: false,
    manageTags: false,
    manageMedia: false,
    manageComments: false,
    manageUsers: false,
    managePermissions: false,
    accessDashboard: false,
    viewAnalytics: false,
    viewSliver: false,
    deleteSliver: false
  }
};

exports.checkPermission = (role, permission) => {
  return defaultPermissions[role]?.[permission] || false;
};

// Initialize permissions in DB (run once)
exports.initializePermissions = async () => {
  for (const [role, permissions] of Object.entries(defaultPermissions)) {
    await Permission.findOneAndUpdate(
      { role },
      { permissions },
      { upsert: true }
    );
  }
};