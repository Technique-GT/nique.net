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
// Article Endpoints (aligned with backend routes)
// =============================================================================

/**
 * Fetch published articles with pagination.
 * backend: GET /articles/published
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

  // Note: backend currently ignores the categoryId filter for /articles/published.
  // Keep client-side filtering for now to avoid incorrect cross-category mixes.
  const response = await apiClient.get('/articles/published', { params: queryParams, signal });
  const data = unwrap(response.data) as ArticleDocument[];

  if (params.categoryId) {
    return data.filter((article) => {
      const category = (article as any).categoryId;
      // categoryId is typically populated object: { _id, name, slug }
      const id = typeof category === 'object' && category ? category._id : category;
      return typeof id === 'string' ? id === params.categoryId : String(id) === params.categoryId;
    });
  }

  return data;
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
  // backend /articles/published uses categoryId, not category
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
 * backend: GET /articles/sticky
 */
const fetchStickyArticles = async (
   _limit?: number, // backend sticky endpoint doesn't support limit, returns all
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const response = await apiClient.get('/articles/sticky', { signal });
  return unwrap(response.data);
};

/**
 * Fetch featured articles.
 * backend: GET /articles/featured
 */
const fetchFeaturedArticles = async (
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const response = await apiClient.get('/articles/featured', { signal });
  return unwrap(response.data);
};

/**
 * Fetch articles by category.
 * backend: GET /articles/category/:category
 */
const fetchArticlesByCategory = async (
  categoryId: string,
   _limit?: number, // backend doesn't support limit on this route
  signal?: AbortSignal
): Promise<ArticleDocument[]> => {
  const response = await apiClient.get(`/articles/category/${categoryId}`, { signal });
  return unwrap(response.data);
};

/**
 * Fetch a single article by ID.
 * backend: GET /articles/:id
 */
const fetchArticleById = async (
  id: string,
  signal?: AbortSignal
): Promise<ArticleDocument> => {
  const response = await apiClient.get(`/articles/${id}`, { signal });
  return unwrap(response.data);
};

/**
 * Fetch a single article by slug.
 * backend: GET /articles/slug/:slug
 */
const fetchArticleBySlug = async (
  slug: string,
  signal?: AbortSignal
): Promise<ArticleDocument> => {
  const response = await apiClient.get(`/articles/slug/${slug}`, { signal });
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
 * backend: GET /articles/feed
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
 * backend: GET /categories (no limit param)
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
  fetchFeaturedArticles,
  fetchArticlesByCategory,
  fetchCategories,
  fetchArticleById,
  fetchArticleBySlug,
  searchArticles,
  fetchArticleFeed,
};
