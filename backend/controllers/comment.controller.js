const Comment = require('../models/comment.model');

/**
 * Return approved, non-spam comments for a given article in reverse
 * chronological order. Populates basic author info so the client can
 * display attribution without an additional query.
 */
exports.getCommentsForArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    const comments = await Comment.find({
      article: articleId,
      isApproved: true,
      isSpam: { $ne: true },
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
