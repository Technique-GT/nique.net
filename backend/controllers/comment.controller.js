const Comment = require('../models/comment.model');

const DEFAULT_AVATAR_URL = 'https://www.gravatar.com/avatar/?d=mp&f=y';

const formatCommentResponse = (comment) => ({
  _id: comment._id,
  content: comment.content,
  createdAt: comment.createdAt,
  thumbsUp: comment.thumbsUp ?? 0,
  thumbsDown: comment.thumbsDown ?? 0,
  author: {
    name: comment.author?.name || 'Reader',
    avatar: comment.author?.avatar || DEFAULT_AVATAR_URL,
  },
});

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
    }).sort({ createdAt: -1 });

    res.json(comments.map(formatCommentResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.postComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content, name, avatar } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    const authorName = typeof name === 'string' && name.trim() ? name.trim() : 'Reader';

    const avatarUrl =
      typeof avatar === 'string' && avatar.trim() ? avatar.trim() : DEFAULT_AVATAR_URL;

    const newComment = new Comment({
      article: articleId,
      content: content.trim(),
      author: {
        name: authorName,
        avatar: avatarUrl,
      },
    });

    const savedComment = await newComment.save();

    res.status(201).json(formatCommentResponse(savedComment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateThumbs = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type, delta } = req.body;

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({ message: 'Invalid vote type.' });
    }

    const numericDelta = Number(delta);
    if (![1, -1].includes(numericDelta)) {
      return res.status(400).json({ message: 'Invalid delta.' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const field = type === 'up' ? 'thumbsUp' : 'thumbsDown';
    const currentValue = comment[field] || 0;
    comment[field] = Math.max(0, currentValue + numericDelta);

    await comment.save();

    res.json(formatCommentResponse(comment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
