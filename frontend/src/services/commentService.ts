import apiClient, { unwrap } from './apiClient';
import type { Comment } from '../types/article';

// =============================================================================
// Comment Endpoints (aligned with backend routes)
// =============================================================================

/**
 * Fetch comments for an article.
 * backend: GET /comments/article/:articleId
 * Returns approved comments by default, structured as a tree with `replies`.
 */
const fetchCommentsByArticle = async (
  articleId: string,
  signal?: AbortSignal
): Promise<Comment[]> => {
  const response = await apiClient.get(`/comments/article/${articleId}`, { signal });
  return unwrap(response.data);
};

/**
 * Create a new comment on an article.
 * backend: POST /comments
 * Body: { articleId, content, username }
 */
const createComment = async (
  articleId: string,
  payload: { content: string; username?: string }
): Promise<Comment> => {
  const body = {
    articleId,
    content: payload.content,
    username: payload.username || 'Anonymous',
  };
  const response = await apiClient.post('/comments', body);
  return unwrap(response.data);
};

/**
 * Like a comment.
 * backend: PATCH /comments/:id/like
 */
const likeComment = async (commentId: string): Promise<Comment> => {
  const response = await apiClient.patch(`/comments/${commentId}/like`);
  return unwrap(response.data);
};

/**
 * Dislike a comment.
 * backend: PATCH /comments/:id/dislike
 */
const dislikeComment = async (commentId: string): Promise<Comment> => {
  const response = await apiClient.patch(`/comments/${commentId}/dislike`);
  return unwrap(response.data);
};

export default {
  fetchCommentsByArticle,
  createComment,
  likeComment,
  dislikeComment,
};
