const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// Public read-only access to article comments
router.get('/article/:articleId', commentController.getCommentsForArticle);

module.exports = router;
