import apiClient, { unwrap } from './apiClient';
import type { Comment } from '../types/article';
import { getDeviceId } from '../utils/deviceId';

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
  const response = await apiClient.get(`/comments/article/${articleId}`, {
    signal,
    headers: { 'x-device-id': getDeviceId() },
  });
  return unwrap(response.data);
};

/**
 * Create a new comment on an article.
 * backend: POST /comments
 * Body: { articleId, content, username }
 */
const createComment = async (
  articleId: string,
  payload: { content: string; username?: string; parentCommentId?: string }
): Promise<Comment> => {
  const body = {
    articleId,
    content: payload.content,
    username: payload.username || 'Anonymous',
    ...(payload.parentCommentId ? { parentCommentId: payload.parentCommentId } : {}),
  };
  const response = await apiClient.post('/comments', body);
  return unwrap(response.data);
};

/**
 * Set comment reaction (persisted per device).
 * backend: PUT /comments/:id/reaction
 */
const setCommentReaction = async (
  commentId: string,
  reaction: 'up' | 'down' | null
): Promise<Comment> => {
  const response = await apiClient.put(
    `/comments/${commentId}/reaction`,
    { reaction, deviceId: getDeviceId() },
    { headers: { 'x-device-id': getDeviceId() } }
  );
  return unwrap(response.data);
};

export default {
  fetchCommentsByArticle,
  createComment,
  setCommentReaction,
};
