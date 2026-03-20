import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import Seo from '../components/Seo';
import ArticleBlock from '../components/ArticleBlock';
import authorService from '../services/authorService';
import articleService from '../services/articleService';
import type { ArticleDocument, AuthorProfile } from '../types/article';

const PAGE_SIZE = 8;

const DEFAULT_AUTHOR_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'%3E%3Crect width='120' height='120' rx='60' fill='%23E5E7EB'/%3E%3Ccircle cx='60' cy='45' r='22' fill='%239CA3AF'/%3E%3Cpath d='M25 100c0-19.33 15.67-35 35-35s35 15.67 35 35' fill='%239CA3AF'/%3E%3C/svg%3E";

const toSafeExternalUrl = (value: string): string | null => {
    const raw = value.trim();
    if (!raw) return null;

    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
    } catch {
        return null;
    }
};

export default function Authors() {
    const { authorName } = useParams();

    const normalizedAuthorName = useMemo(() => {
        if (!authorName) return '';
        try {
        return decodeURIComponent(authorName).trim();
        } catch {
        return authorName.trim();
        }
    }, [authorName]);

    const [author, setAuthor] = useState<AuthorProfile | null>(null);
    const [isAuthorLoading, setIsAuthorLoading] = useState(true);
    const [authorNotFound, setAuthorNotFound] = useState(false);
    const [authorError, setAuthorError] = useState<string | null>(null);
    const [imageFailed, setImageFailed] = useState(false);

    const [articles, setArticles] = useState<ArticleDocument[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isArticlesLoading, setIsArticlesLoading] = useState(false);
    const [articlesError, setArticlesError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadAuthor = async () => {
        if (!normalizedAuthorName) {
            setIsAuthorLoading(false);
            setAuthorNotFound(true);
            setAuthorError(null);
            setAuthor(null);
            return;
        }

        setIsAuthorLoading(true);
        setAuthorNotFound(false);
        setAuthorError(null);
        setAuthor(null);
        setImageFailed(false);
        setArticles([]);
        setPage(1);
        setTotalPages(1);
        setArticlesError(null);

        try {
            const data = await authorService.fetchAuthorByName(normalizedAuthorName, controller.signal);
            if (!controller.signal.aborted) {
            setAuthor(data);
            }
        } catch (error) {
            if (controller.signal.aborted) return;

            const status = (error as AxiosError<{ message?: string }>)?.response?.status;
            if (status === 404) {
            setAuthorNotFound(true);
            return;
            }

            setAuthorError('Unable to load this author right now.');
        } finally {
            if (!controller.signal.aborted) {
            setIsAuthorLoading(false);
            }
        }
        };

        loadAuthor();

        return () => controller.abort();
    }, [normalizedAuthorName]);

    useEffect(() => {
        if (!author?._id) return;

        const controller = new AbortController();

        const loadArticles = async () => {
        setIsArticlesLoading(true);
        setArticlesError(null);

        try {
            const response = await articleService.fetchArticleFeed(
            {
                authorId: author._id,
                page,
                limit: PAGE_SIZE,
            },
            controller.signal
            );

            if (controller.signal.aborted) return;

            const nextArticles = response.data || [];
            setArticles((previous) => (page === 1 ? nextArticles : [...previous, ...nextArticles]));
            setTotalPages(response.pagination?.pages || 1);
        } catch (error) {
            if (controller.signal.aborted) return;
            const message = error instanceof Error ? error.message : 'Unable to load articles.';
            setArticlesError(message);
        } finally {
            if (!controller.signal.aborted) {
            setIsArticlesLoading(false);
            }
        }
        };

        loadArticles();

        return () => controller.abort();
    }, [author?._id, page]);

    const safeSocials = useMemo(() => {
        if (!author?.socialLinks) return [];

        return author.socialLinks
        .map((link) => {
            const platform = link.platform.trim();
            const url = toSafeExternalUrl(link.url);
            return platform && url ? { platform, url } : null;
        })
        .filter((entry): entry is { platform: string; url: string } => entry !== null);
    }, [author?.socialLinks]);

    const hasMore = page < totalPages;
    const displayImage =
        !imageFailed && typeof author?.profilePictureUrl === 'string' && author.profilePictureUrl.trim().length > 0
        ? author.profilePictureUrl
        : DEFAULT_AUTHOR_AVATAR;

    const pageTitle = author?.name ? `${author.name}` : normalizedAuthorName || 'Author';

    if (isAuthorLoading) {
        return (
        <>
            <Navbar />
            <div className='flex h-screen items-center justify-center'>
            <Spinner />
            </div>
        </>
        );
    }

    if (authorNotFound) {
        return (
        <>
            <Seo
            title='Author Not Found'
            description='The author page you requested could not be found.'
            canonicalPath={normalizedAuthorName ? `/author/${encodeURIComponent(normalizedAuthorName)}` : '/author'}
            />
            <Navbar />
            <div className='mx-auto max-w-4xl p-6'>
            <h1 className='text-3xl font-bold text-nique-blue'>Author not found</h1>
            <p className='mt-2 text-nique-blue/80'>The requested author profile could not be found.</p>
            </div>
        </>
        );
    }

    if (authorError || !author) {
        return (
        <>
            <Navbar />
            <div className='mx-auto max-w-4xl p-6'>
            <h1 className='text-3xl font-bold text-nique-blue'>Unable to load author</h1>
            <p className='mt-2 text-red-600'>{authorError || 'Something went wrong.'}</p>
            </div>
        </>
        );
    }

    return (
        <>
        <Seo
            title={pageTitle}
            description={author.bio?.trim() || `${author.name}'s published articles on Technique.`}
            canonicalPath={`/author/${encodeURIComponent(author.name)}`}
        />
        <Navbar />
        <div className='mx-auto max-w-6xl space-y-8 p-6'>
            <section className='rounded-lg p-6'>
            <div className='flex flex-col gap-6 md:flex-row md:items-start'>
                <img
                src={displayImage}
                alt={`${author.name} profile`}
                className='size-28 rounded-full border border-slate-200 object-cover bg-slate-100'
                onError={() => setImageFailed(true)}
                />

                <div className='space-y-3'>
                <h3 className='text-3xl font-bold text-nique-blue'>{author.name}</h3>
                {author.bio?.trim() && <p className='max-w-3xl text-base text-nique-blue/90 whitespace-pre-wrap wrap-break-word'>{author.bio}</p>}

                {safeSocials.length > 0 && (
                    <div className='flex flex-wrap gap-3'>
                    {safeSocials.map((link) => (
                        <a
                        key={`${link.platform}-${link.url}`}
                        href={link.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='rounded-full border border-slate-300 px-3 py-1 text-sm text-nique-blue hover:bg-slate-50'
                        >
                        {link.platform}
                        </a>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </section>

            <section className='space-y-4'>
            <h2 className='text-xl font-bold text-nique-blue'>Articles by {author.name}</h2>

            {articlesError && (
                <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                {articlesError}
                </div>
            )}

            {articles.length === 0 && !isArticlesLoading && !articlesError && (
                <p className='text-nique-blue/80'>No published articles yet.</p>
            )}

            {articles.length > 0 && (
                <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                {articles.map((article) => (
                    <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                ))}
                </div>
            )}

            {isArticlesLoading && (
                <div className='flex justify-center py-2'>
                <Spinner />
                </div>
            )}

            {!isArticlesLoading && hasMore && (
                <div className='flex justify-center'>
                <button
                    type='button'
                    onClick={() => setPage((current) => current + 1)}
                    className='rounded-md bg-nique-blue px-4 py-2 text-sm font-medium text-white hover:bg-nique-blue-hover'
                >
                    <h4>Load more</h4>
                </button>
                </div>
            )}
            </section>
        </div>
        </>
    );
}
