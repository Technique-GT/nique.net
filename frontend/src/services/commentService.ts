import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

const fetchCommentsByArticle = (articleId: string, signal?: AbortSignal) => {
  return apiClient.get(`/comments/article/${articleId}`, { signal });
};

export default {
  fetchCommentsByArticle,
};
