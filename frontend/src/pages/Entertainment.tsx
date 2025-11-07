import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { Categories } from '../types/categories';
import InfiniteScrollModule from '../components/InfiniteScrollModule';

const mapArticleToPost = (article: any): Post => {
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

    const descriptionSource = article.excerpt || article.content || '';
    const normalizedDescription =
        typeof descriptionSource === 'string'
        ? descriptionSource.replace(/<[^>]*>/g, '').slice(0, 220)
        : '';

    return {
        id: article._id || '',
        title: article.title || '',
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

function Entertainment() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentEntertainment, setRecentEntertainment] = useState<Post[]>([]);
    const [entertainmentArticles, setEntertainmentArticles] = useState<Post[]>([]);
    const [filmtv, setFilmAndTV] = useState<Post[]>([]);
    const [music, setMusic] = useState<Post[]>([]);
    const [artsTheatre, setArtsTheatre] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [entertainmentCategoryId, setEntertainmentCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadArticles = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
            const categories = categoriesResponse.data || [];

            const entertainmentCategory = categories.find((category: any) =>
            category.name?.toLowerCase() === Categories.ENTERTAINMENT.toLowerCase()
            );
            setEntertainmentCategoryId(entertainmentCategory?._id || null);

            if (!entertainmentCategory?._id) {
            if (!isMounted) return;
            setEntertainmentArticles([]);
            setError('Entertainment category not found.');
            return;
            }

            const entertainmentResponse = await articleService.fetchArticles(
                { category: entertainmentCategory._id, status: 'published' },
                controller.signal
            );

            const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
            const allEntertainment = mapResponseData(entertainmentResponse.data);
            const getTimestamp = (post: Post) => {
                const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                return Math.max(published, created);
            };
            const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

            const stickyPosts = allEntertainment.filter((post) => post.isSticky).sort(sortByPublishedDesc);
            const nonStickyPosts = allEntertainment.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
            const orderedEntertainment = [...stickyPosts, ...nonStickyPosts];
            const RECENT_COUNT = Math.max(3, stickyPosts.length);
            const recentSelection = orderedEntertainment.slice(0, RECENT_COUNT);
            const remainingEntertainment = orderedEntertainment.slice(RECENT_COUNT);
            const recentIds = new Set(recentSelection.map((post) => post.id));

            const filterBySubcategory = (articles: any[], subcategory: string) =>
                articles
                    .filter((article: any) =>
                        Array.isArray(article.subcategories) &&
                        article.subcategories.some(
                            (sub: any) =>
                                typeof sub?.value === 'string' &&
                                sub.value.toLowerCase() === subcategory
                        )
                    )
                    .map(mapArticleToPost)
                    .filter((post) => !recentIds.has(post.id))
                    .sort(sortByPublishedDesc);

            if (!isMounted) {
                return;
            }

            setRecentEntertainment(recentSelection);
            setEntertainmentArticles(remainingEntertainment);
            setFilmAndTV(filterBySubcategory(entertainmentResponse.data || [], 'film & tv'));
            setMusic(filterBySubcategory(entertainmentResponse.data || [], 'music'));
            setArtsTheatre(filterBySubcategory(entertainmentResponse.data || [], 'arts & theatre'));

        } catch (err) {
            if (!isMounted) {
                return;
            }
            setError('Unable to load articles. Please try again later.');
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
        };

        loadArticles();

        return () => {
        isMounted = false;
        controller.abort();
        };
    }, []);

    if (isLoading) {
        return (
        <div className="flex justify-center items-center h-screen">
            <Spinner />
        </div>
        );
    }

    if (error) {
        return (
        <>
            <Navbar />
            <div className="flex justify-center items-center h-screen">
            <p className="text-center text-lg text-red-600">{error}</p>
            </div>
        </>
        );
    }

    return (
        <>
        <Navbar />
        <div className='max-w-[1470px] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
            <div className='w-full'>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-4 m-0'>
                {recentEntertainment.slice(0, 4).length > 0 && (
                    <Carousel posts={recentEntertainment.slice(0, 4)} width='70%'/>
                )}
                </div>
            </div>
            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Music</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-2 sm:col-span-2'>
                {music[0] && <ArticleBlock post={music[0]} height='400px'/>}
                </div>

                <div className='grid gap-4 grid-cols-2 lg:col-span-2'>
                {music.slice(1, 5).map((article) => (
                    <ArticleBlock key={article.id} post={article} height='190px' />
                ))}
                </div>
            </div>

            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Film & TV</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                {filmtv.slice(0, 4).map((article) => (
                <ArticleBlock key={article.id} post={article} height='230px' />
                ))}
            </div>

            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Arts & Theatre</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                {(() => {
                const posts = artsTheatre.slice(0, 2);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
                {(() => {
                const posts = artsTheatre.slice(2, 4);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
            </div>

            <InfiniteScrollModule categoryId={entertainmentCategoryId ?? undefined} />
            </div>

            <div className='flex flex-col gap-4'>
                <iframe
                    className="rounded-md w-full h-[550px]"
                    src="https://open.spotify.com/embed/playlist/6hWrY7npl9UIbUzlRgpwoo?utm_source=generator"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                />
                {(() => {
                    const posts = entertainmentArticles.slice(0, 5)
                    .filter(Boolean) as Post[];
                    return posts.length ? <SideArticle posts={posts} width='28%'/> : null;
                })()}
            </div>
        </div>
        </>
    )
}

export default Entertainment;
