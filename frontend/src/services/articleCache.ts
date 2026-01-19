import type { ArticleDocument } from '../types/article';

/**
 * Simple in-memory cache for articles to prevent "not found" flash
 * when navigating between pages. The cache is keyed by both ID and slug.
 */
class ArticleCache {
  private cache: Map<string, ArticleDocument> = new Map();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private timestamps: Map<string, number> = new Map();

  /**
   * Store an article in the cache, keyed by both ID and slug
   */
  set(article: ArticleDocument): void {
    const now = Date.now();
    
    if (article._id) {
      this.cache.set(article._id, article);
      this.timestamps.set(article._id, now);
    }
    
    if (article.slug) {
      this.cache.set(article.slug, article);
      this.timestamps.set(article.slug, now);
    }
  }

  /**
   * Get an article from the cache by ID or slug
   */
  get(key: string): ArticleDocument | null {
    const timestamp = this.timestamps.get(key);
    
    // Check if expired
    if (timestamp && Date.now() - timestamp > this.maxAge) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  /**
   * Check if an article exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

export const articleCache = new ArticleCache();
