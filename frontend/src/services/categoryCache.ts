import type { ArticleDocument, Category } from '../types/article';

/**
 * In-memory cache for category data to enable instant navigation between pages.
 * Uses a stale-while-revalidate pattern: show cached data immediately,
 * fetch fresh data in background.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CategoryCache {
  private categories: CacheEntry<Category[]> | null = null;
  private articlesByCategory: Map<string, CacheEntry<ArticleDocument[]>> = new Map();
  private stickyArticles: CacheEntry<ArticleDocument[]> | null = null;
  private featuredArticles: CacheEntry<ArticleDocument[]> | null = null;
  
  // 5 minute TTL
  private maxAge = 5 * 60 * 1000;

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.maxAge;
  }

  // ============================================================================
  // Categories
  // ============================================================================

  setCategories(categories: Category[]): void {
    this.categories = {
      data: categories,
      timestamp: Date.now(),
    };
  }

  getCategories(): Category[] | null {
    if (!this.categories || this.isExpired(this.categories.timestamp)) {
      return null;
    }
    return this.categories.data;
  }

  getCategoryId(name: string): string | null {
    const categories = this.getCategories();
    if (!categories) return null;
    
    const match = categories.find(
      (cat) => cat.name?.toLowerCase() === name.toLowerCase()
    );
    return match?._id || null;
  }

  // ============================================================================
  // Articles by Category
  // ============================================================================

  setCategoryArticles(categoryName: string, articles: ArticleDocument[]): void {
    const key = categoryName.toLowerCase();
    this.articlesByCategory.set(key, {
      data: articles,
      timestamp: Date.now(),
    });
  }

  getCategoryArticles(categoryName: string): ArticleDocument[] | null {
    const key = categoryName.toLowerCase();
    const entry = this.articlesByCategory.get(key);
    
    if (!entry || this.isExpired(entry.timestamp)) {
      return null;
    }
    return entry.data;
  }

  hasCategoryArticles(categoryName: string): boolean {
    return this.getCategoryArticles(categoryName) !== null;
  }

  // ============================================================================
  // Sticky Articles
  // ============================================================================

  setStickyArticles(articles: ArticleDocument[]): void {
    this.stickyArticles = {
      data: articles,
      timestamp: Date.now(),
    };
  }

  getStickyArticles(): ArticleDocument[] | null {
    if (!this.stickyArticles || this.isExpired(this.stickyArticles.timestamp)) {
      return null;
    }
    return this.stickyArticles.data;
  }

  // ============================================================================
  // Featured Articles
  // ============================================================================

  setFeaturedArticles(articles: ArticleDocument[]): void {
    this.featuredArticles = {
      data: articles,
      timestamp: Date.now(),
    };
  }

  getFeaturedArticles(): ArticleDocument[] | null {
    if (!this.featuredArticles || this.isExpired(this.featuredArticles.timestamp)) {
      return null;
    }
    return this.featuredArticles.data;
  }

  // ============================================================================
  // Utility
  // ============================================================================

  clear(): void {
    this.categories = null;
    this.articlesByCategory.clear();
    this.stickyArticles = null;
    this.featuredArticles = null;
  }

  /**
   * Check if all main categories have cached data
   */
  isFullyPopulated(): boolean {
    const requiredCategories = ['life', 'news', 'entertainment', 'opinions', 'sports'];
    return requiredCategories.every((cat) => this.hasCategoryArticles(cat));
  }
}

export const categoryCache = new CategoryCache();
