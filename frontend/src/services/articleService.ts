import axios from 'axios';
import type { ArticleDocument } from '../types/article';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

export interface FetchArticleFeedParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  author?: string;
  search?: string;
  isSticky?: boolean;
  offset?: number;
}

export interface PaginatedArticlesResponse {
  data: ArticleDocument[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  offset: number;
  nextOffset: number;
}

export interface FetchArticlesParams {
  status?: string;
  category?: string;
  author?: string;
  search?: string;
  limit?: number;
  isSticky?: boolean;
}

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

const fetchArticles = (params: FetchArticlesParams = {}, signal?: AbortSignal) => {
  const formattedParams: Record<string, string | number> = {};

  if (params.status) {
    formattedParams.status = params.status;
  }
  if (params.category) {
    formattedParams.category = params.category;
  }
  if (params.author) {
    formattedParams.author = params.author;
  }
  if (params.search) {
    formattedParams.search = params.search;
  }
  if (typeof params.limit === 'number') {
    formattedParams.limit = params.limit;
  }
  if (typeof params.isSticky === 'boolean') {
    formattedParams.isSticky = params.isSticky ? 'true' : 'false';
  }

  return apiClient.get('/articles', {
    params: formattedParams,
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

const searchArticles = (query: string, limit?: number, signal?: AbortSignal) => {
  const params: Record<string, string | number> = {
    status: 'published',
    search: query,
  };

  if (typeof limit === 'number') {
    params.limit = limit;
  }

  return apiClient.get('/articles', {
    params,
    signal,
  });
};

const fetchArticleFeed = (params: FetchArticleFeedParams = {}, signal?: AbortSignal) => {
  const formattedParams: Record<string, string | number> = {};

  if (typeof params.page === 'number') {
    formattedParams.page = params.page;
  }
  if (typeof params.limit === 'number') {
    formattedParams.limit = params.limit;
  }
  if (params.status) {
    formattedParams.status = params.status;
  }
  if (params.category) {
    formattedParams.category = params.category;
  }
  if (params.author) {
    formattedParams.author = params.author;
  }
  if (params.search) {
    formattedParams.search = params.search;
  }
  if (typeof params.isSticky === 'boolean') {
    formattedParams.isSticky = params.isSticky ? 'true' : 'false';
  }
  if (typeof params.offset === 'number' && !Number.isNaN(params.offset)) {
    formattedParams.offset = params.offset;
  }

  return apiClient
    .get<PaginatedArticlesResponse>('/articles/feed/paginated', {
      params: formattedParams,
      signal,
    })
    .then((response) => response.data);
};

export default {
  fetchRecentArticles,
  fetchArticles,
  fetchStickyArticles,
  fetchArticlesByCategory,
  fetchCategories,
  fetchArticleById,
  searchArticles,
  fetchArticleFeed,
};
