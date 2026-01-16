import apiClient, { unwrap, extractPagination } from './apiClient';
import type { ArticleDocument, Category, FeedResponse } from '../types/article';

// =============================================================================
// Types
// =============================================================================

export interface FetchArticleFeedParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  search?: string;
  isSticky?: boolean;
}

export interface FetchArticlesParams {
  categoryId?: string;
  search?: string;
  limit?: number;
  page?: number;
}

// =============================================================================
// Article Endpoints (aligned with newbackend routes)
// =============================================================================

/**
 * Fetch published articles with pagination.
 * newbackend: GET /articles/published
 */
const fetchPublishedArticles = async (
  params: FetchArticlesParams = {},
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const queryParams: Record<string, string | number> = {};

  if (typeof params.page === 'number') queryParams.page = params.page;
  if (typeof params.limit === 'number') queryParams.limit = params.limit;
  if (params.categoryId) queryParams.categoryId = params.categoryId;
  if (params.search) queryParams.search = params.search;

  const response = await apiClient.get('/articles/published', { params: queryParams, signal });
  return unwrap(response.data);
};

/**
 * Fetch recent published articles.
 * Uses /articles/published with limit.
 */
const fetchRecentArticles = async (
  limit = 5,
  _status = 'published', // kept for signature compat, ignored
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  return fetchPublishedArticles({ limit }, signal);
};

/**
 * Generic fetch for published articles (used by Home.tsx for category sections).
 * Maps old `category` param to `categoryId`.
 */
const fetchArticles = async (
  params: { category?: string; status?: string; limit?: number; search?: string } = {},
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  // newbackend /articles/published uses categoryId, not category
  return fetchPublishedArticles(
    {
      categoryId: params.category,
      limit: params.limit,
      search: params.search,
    },
    signal
  );
};

/**
 * Fetch sticky articles.
 * newbackend: GET /articles/sticky
 */
const fetchStickyArticles = async (
  _limit?: number, // newbackend sticky endpoint doesn't support limit, returns all
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const response = await apiClient.get('/articles/sticky', { signal });
  return unwrap(response.data);
};

/**
 * Fetch articles by category.
 * newbackend: GET /articles/category/:category
 */
const fetchArticlesByCategory = async (
  categoryId: string,
  _limit?: number, // newbackend doesn't support limit on this route
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const response = await apiClient.get(`/articles/category/${categoryId}`, { signal });
  return unwrap(response.data);
};

/**
 * Fetch a single article by ID.
 * newbackend: GET /articles/:id
 */
const fetchArticleById = async (
  id: string,
  signal?: AbortSignal
): Promise<ArticleDocument> => {
  const response = await apiClient.get(`/articles/${id}`, { signal });
  return unwrap(response.data);
};

/**
 * Search published articles.
 * Uses /articles/published with search param.
 */
const searchArticles = async (
  query: string,
  limit?: number,
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  return fetchPublishedArticles({ search: query, limit }, signal);
};

/**
 * Fetch paginated feed for infinite scroll.
 * newbackend: GET /articles/feed
 * Returns page-based pagination.
 */
const fetchArticleFeed = async (
  params: FetchArticleFeedParams = {},
  signal?: AbortSignal
): Promise<FeedResponse> => {
  const queryParams: Record<string, string | number> = {};

  if (typeof params.page === 'number') queryParams.page = params.page;
  if (typeof params.limit === 'number') queryParams.limit = params.limit;
  if (params.categoryId) queryParams.categoryId = params.categoryId;
  if (params.tagId) queryParams.tagId = params.tagId;
  if (params.authorId) queryParams.authorId = params.authorId;
  if (params.search) queryParams.search = params.search;
  if (typeof params.isSticky === 'boolean') {
    queryParams.isSticky = params.isSticky ? 'true' : 'false';
  }

  const response = await apiClient.get('/articles/feed', { params: queryParams, signal });
  const data = unwrap(response.data) as ArticleDocument[];
  const pagination = extractPagination(response.data);

  return {
    data,
    pagination: pagination || { total: data.length, page: 1, pages: 1, limit: data.length },
  };
};

// =============================================================================
// Category Endpoints
// =============================================================================

/**
 * Fetch all categories.
 * newbackend: GET /categories (no limit param)
 */
const fetchCategories = async (
  _limit = 50, // kept for signature compat, ignored
  signal?: AbortSignal
): Promise<Category[]> => {
  const response = await apiClient.get('/categories', { signal });
  return unwrap(response.data);
};

// =============================================================================
// Exports
// =============================================================================

export default {
  fetchRecentArticles,
  fetchArticles,
  fetchPublishedArticles,
  fetchStickyArticles,
  fetchArticlesByCategory,
  fetchCategories,
  fetchArticleById,
  searchArticles,
  fetchArticleFeed,
};
