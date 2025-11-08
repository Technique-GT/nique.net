import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

const fetchCommentsByArticle = (articleId: string, signal?: AbortSignal) => {
  return apiClient.get(`/comments/article/${articleId}`, { signal });
};

const createComment = (
  articleId: string,
  payload: { content: string; name?: string; avatar?: string }
) => {
  return apiClient.post(`/comments/article/${articleId}`, payload);
};

const updateThumbs = (
  commentId: string,
  payload: { type: 'up' | 'down'; delta: 1 | -1 }
) => {
  return apiClient.patch(`/comments/${commentId}/thumbs`, payload);
};

export default {
  fetchCommentsByArticle,
  createComment,
  updateThumbs,
};
