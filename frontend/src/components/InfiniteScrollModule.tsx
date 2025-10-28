import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import articleService from '../services/articleService';
import type { Post } from '../types/article';

const PAGE_SIZE = 8;

interface InfiniteScrollModuleProps {
    categoryId?: string;
    startOffset?: number;
}

const mapArticleToPost = (article: any): Post => {
    // add primary author
    const primaryAuthor = article.authors?.[0]?.user;

    let authorName = 'Technique Staff';
    if (primaryAuthor) {
        if (typeof primaryAuthor === 'string') {
        authorName = primaryAuthor;
        } else {
        const firstAndLast = [primaryAuthor.firstName, primaryAuthor.lastName]
            .filter(Boolean)
            .join(' ');

        authorName =
            primaryAuthor.username ||
            firstAndLast ||
            primaryAuthor.email ||
            authorName;
        }
    }

    // add description
    const descriptionSource = article.excerpt || article.content || '';
    const normalizedDescription =
        typeof descriptionSource === 'string'
        ? descriptionSource.replace(/<[^>]*>/g, '').slice(0, 220)
        : '';

    return {
        id: article._id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        authors: article.authors || [],
        categories: article.categories || [],
        tags: article.tags || [],
        featuredImage: article.featuredImage,
        status: article.status,
        isSticky: article.isSticky,
        allowComments: article.allowComments,
        viewCount: article.viewCount,
        publishedAt: article.publishedAt,
        updatedBy: article.updatedBy,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        desc: normalizedDescription,
        author: authorName,
        category: article.categories?.[0]?.name || '',
    };
};

function InfiniteScrollModule({ categoryId, startOffset = 0 }: InfiniteScrollModuleProps) {
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [articles, setArticles] = useState<Post[]>([]);
    const [offset, setOffset] = useState(startOffset);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nextOffsetRef = useRef(startOffset);

    const supportsIntersectionObserver = useMemo(
        () => typeof window !== 'undefined' && 'IntersectionObserver' in window,
        [],
    );

    useEffect(() => {
        setArticles([]);
        setOffset(startOffset);
        setHasMore(true);
        setError(null);
        nextOffsetRef.current = startOffset;
    }, [categoryId, startOffset]);

    useEffect(() => {
        let isCurrent = true;
        const controller = new AbortController();

        const fetchArticles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const payload = await articleService.fetchArticleFeed(
            { offset, category: categoryId, limit: PAGE_SIZE, status: 'published' },
            controller.signal,
            );

            if (!isCurrent) return;

            const mappedArticles = (payload.data || []).map(mapArticleToPost);
            setArticles((prev) => offset === startOffset ? mappedArticles : [...prev, ...mappedArticles]);
            setHasMore(payload.hasMore);
            nextOffsetRef.current = payload.nextOffset ?? offset + mappedArticles.length;
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
    }, [offset, categoryId, startOffset]);

    const requestNextPage = useCallback(() => {
        if (isLoading || !hasMore) return;
        const nextOffset = nextOffsetRef.current;
        if (typeof nextOffset === 'number') {
            setOffset(nextOffset);
        }
    }, [hasMore, isLoading]);

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
        { rootMargin: '400px 0px 0px 0px' },
        );

        observer.observe(sentinel);

        return () => {
        observer.disconnect();
        };
    }, [requestNextPage, supportsIntersectionObserver]);

    const renderArticles = (article: Post) => {
        const key = article.id;
        return (
        <article
            key={key}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
        >
            <p className="text-xs uppercase tracking-wide text-slate-400">
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}  &#8226; {article.category}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-nique-blue">{article.title}</h3>
            {article.excerpt && <h6 className="text-sm text-slate-600">{article.excerpt}</h6>}
        </article>
        );
    };

    if (articles.length === 0 && !hasMore && !isLoading) {
        return
    }

    return (
        <div className="space-y-6">
        <hr className='my-4' />
        <div className="grid gap-4 md:grid-cols-2">{articles.map(renderArticles)}</div>

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
