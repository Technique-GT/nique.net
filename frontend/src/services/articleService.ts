import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

const fetchRecentArticles = (limit = 5, status = 'published', signal?: AbortSignal) => {
  const params: Record<string, string | number> = { status };
  if (limit !== undefined) {
    params.limit = limit;
  }

  return apiClient.get('/articles', {
    params,
    signal,
  });
};

const fetchStickyArticles = (limit?: number, signal?: AbortSignal) => {
  const params: Record<string, string | number> = { status: 'published', isSticky: 'true' };
  if (limit !== undefined) {
    params.limit = limit;
  }

  return apiClient.get('/articles', {
    params,
    signal,
  });
};

const fetchArticlesByCategory = (categoryId: string, limit?: number, signal?: AbortSignal) => {
  const params: Record<string, number> = {};
  if (limit !== undefined) {
    params.limit = limit;
  }

  return apiClient.get(`/articles/category/${categoryId}`, {
    params,
    signal,
  });
};

const fetchCategories = (limit = 50, signal?: AbortSignal) => {
  return apiClient.get('/categories', {
    params: { limit },
    signal,
  });
};

const fetchArticleById = (id: string, signal?: AbortSignal) => {
  return apiClient.get(`/articles/${id}`, { signal });
};

const fetchArticleComments = (articleId: string, signal?: AbortSignal) => {
  return apiClient.get(`/articles/${articleId}/comments`, { signal });
};

export default {
  fetchRecentArticles,
  fetchStickyArticles,
  fetchArticlesByCategory,
  fetchCategories,
  fetchArticleById,
  fetchArticleComments,
};
