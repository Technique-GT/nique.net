import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import articleService from '../services/articleService';
import type { Post } from '../types/article';
import { mapArticleToPost } from '../utils/articleMapping';

const PAGE_SIZE = 8;

interface InfiniteScrollModuleProps {
  categoryId?: string;
  startPage?: number;
}

/**
 * Infinite scroll component using page-based pagination (aligned with backend /articles/feed).
 */
function InfiniteScrollModule({ categoryId, startPage = 1 }: InfiniteScrollModuleProps) {
  const navigate = useNavigate();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [articles, setArticles] = useState<Post[]>([]);
  const [page, setPage] = useState(startPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = page < totalPages;

  const supportsIntersectionObserver = useMemo(
    () => typeof window !== 'undefined' && 'IntersectionObserver' in window,
    []
  );

  // Reset when categoryId changes
  useEffect(() => {
    setArticles([]);
    setPage(startPage);
    setTotalPages(1);
    setError(null);
  }, [categoryId, startPage]);

  // Fetch articles when page changes
  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await articleService.fetchArticleFeed(
          { page, categoryId, limit: PAGE_SIZE },
          controller.signal
        );

        if (!isCurrent) return;

        const mappedArticles = (response.data || []).map(mapArticleToPost);
        
        // On first page, replace; on subsequent pages, append
        setArticles((prev) => (page === startPage ? mappedArticles : [...prev, ...mappedArticles]));
        setTotalPages(response.pagination?.pages || 1);
      } catch (fetchError) {
        if (!isCurrent || controller.signal.aborted) return;

        const fallbackMessage =
          fetchError instanceof Error ? fetchError.message : 'Failed to load more articles.';
        setError(fallbackMessage);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    fetchArticles();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [page, categoryId, startPage]);

  const requestNextPage = useCallback(() => {
    if (isLoading || !hasMore) return;
    setPage((prev) => prev + 1);
  }, [hasMore, isLoading]);

  // IntersectionObserver to trigger next page
  useEffect(() => {
    if (!supportsIntersectionObserver) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          requestNextPage();
        }
      },
      { rootMargin: '400px 0px 0px 0px' }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [requestNextPage, supportsIntersectionObserver]);

  const renderArticle = (article: Post) => {
    const link = article.categorySlug && article.slug ? `/${article.categorySlug}/${article.slug}` : `/${article.id}`;
    return (
      <article
        key={article.id}
        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md cursor-pointer"
        onClick={() => navigate(link)}
      >
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {(() => {
            const rawDate = article.publishedAt ?? article.createdAt ?? Date.now();
            return new Date(rawDate).toLocaleDateString();
          })()}{' '}
          &#8226; {article.category}
        </p>
        <h3 className="mt-1 text-xl font-semibold text-nique-blue">{article.title}</h3>
        {article.excerpt && <h6 className="text-sm text-slate-600">{article.excerpt}</h6>}
      </article>
    );
  };

  // Don't render anything if no articles and not loading
  if (articles.length === 0 && !hasMore && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <hr className="my-4" />
      <div className="grid gap-4 md:grid-cols-2">{articles.map(renderArticle)}</div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="flex w-full justify-center py-4">
        {isLoading ? (
          <span className="text-sm text-slate-500">Loading more stories…</span>
        ) : hasMore ? (
          <span className="text-sm text-slate-400">Keep scrolling for more</span>
        ) : articles.length > 0 ? (
          <span className="text-sm text-slate-400">You've reached the end</span>
        ) : null}
      </div>

      {!supportsIntersectionObserver && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={requestNextPage}
            disabled={isLoading}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollModule;
