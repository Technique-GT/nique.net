import { useEffect } from 'react';
import articleService from '../services/articleService';
import { categoryCache } from '../services/categoryCache';
import { Categories } from '../types/categories';

/**
 * DataPrefetcher - Eagerly loads all category data on app mount.
 * This ensures that navigating between category pages is instant,
 * even if the user lands on a non-home page first.
 * 
 * Renders nothing - just triggers background fetches.
 */
export function DataPrefetcher() {
  useEffect(() => {
    // Don't prefetch if cache is already populated
    if (categoryCache.isFullyPopulated()) {
      return;
    }

    const controller = new AbortController();

    const prefetchAll = async () => {
      try {
        // First, fetch categories (needed for all other fetches)
        let categories = categoryCache.getCategories();
        if (!categories) {
          categories = await articleService.fetchCategories(50, controller.signal);
          categoryCache.setCategories(categories);
        }

        // Helper to find category ID
        const findCategoryId = (name: string) => {
          const match = categories!.find(
            (cat) => cat.name?.toLowerCase() === name.toLowerCase()
          );
          return match?._id || null;
        };

        // Get all category IDs
        const lifeCategoryId = findCategoryId(Categories.LIFE);
        const newsCategoryId = findCategoryId(Categories.NEWS);
        const entertainmentCategoryId = findCategoryId(Categories.ENTERTAINMENT);
        const opinionCategoryId = findCategoryId(Categories.OPINION);
        const sportsCategoryId = findCategoryId(Categories.SPORTS);

        // Fetch all categories in parallel
        const [
          stickyArticles,
          featuredArticles,
          recentArticles,
          lifeArticles,
          newsArticles,
          entertainmentArticles,
          opinionArticles,
          sportsArticles,
        ] = await Promise.all([
          articleService.fetchStickyArticles(undefined, controller.signal).catch(() => []),
          articleService.fetchFeaturedArticles(controller.signal).catch(() => []),
          articleService.fetchRecentArticles(5, 'published', controller.signal).catch(() => []),
          lifeCategoryId
            ? articleService.fetchArticlesByCategory(lifeCategoryId, undefined, controller.signal).catch(() => [])
            : Promise.resolve([]),
          newsCategoryId
            ? articleService.fetchArticlesByCategory(newsCategoryId, undefined, controller.signal).catch(() => [])
            : Promise.resolve([]),
          entertainmentCategoryId
            ? articleService.fetchArticlesByCategory(entertainmentCategoryId, undefined, controller.signal).catch(() => [])
            : Promise.resolve([]),
          opinionCategoryId
            ? articleService.fetchArticlesByCategory(opinionCategoryId, undefined, controller.signal).catch(() => [])
            : Promise.resolve([]),
          sportsCategoryId
            ? articleService.fetchArticlesByCategory(sportsCategoryId, undefined, controller.signal).catch(() => [])
            : Promise.resolve([]),
        ]);

        // Populate cache
        categoryCache.setStickyArticles(stickyArticles);
        categoryCache.setFeaturedArticles(featuredArticles);
        categoryCache.setRecentArticles(recentArticles);
        categoryCache.setCategoryArticles(Categories.LIFE, lifeArticles);
        categoryCache.setCategoryArticles(Categories.NEWS, newsArticles);
        categoryCache.setCategoryArticles(Categories.ENTERTAINMENT, entertainmentArticles);
        categoryCache.setCategoryArticles(Categories.OPINION, opinionArticles);
        categoryCache.setCategoryArticles(Categories.SPORTS, sportsArticles);

        console.log('[DataPrefetcher] All categories prefetched successfully');
      } catch (err) {
        // Silently fail - prefetching is best-effort
        console.warn('[DataPrefetcher] Failed to prefetch some data:', err);
      }
    };

    // Start prefetching after a short delay to not block initial render
    const timeoutId = setTimeout(prefetchAll, 100);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Render nothing
  return null;
}

export default DataPrefetcher;
