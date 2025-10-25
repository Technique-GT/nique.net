import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
import FeaturedStory from '../components/FeaturedStory';
import MockAd from '../assets/mock_advertisement.jpg';
import JustInBlock from '../components/JustIn';
import SideArticle from '../components/SideArticle';
import SmallArticle from '../components/SmallArticle';
import VerticalAd from '../components/VerticalAd';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';

const MAIN_SECTION_LIMIT = 80;
const ATLANTA_SECTION_LIMIT = 8;
const US_SECTION_LIMIT = 8;
const WORLD_SECTION_LIMIT = 6;
const RECENT_MIN_COUNT = 2;

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

    const descriptionSource = article.content || '';
    const normalizedDescription =
        typeof descriptionSource === 'string'
        ? descriptionSource.replace(/<[^>]*>/g, '').slice(0, 220) + '...'
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
        subcategories: article.subcategories || [],
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

function News() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentNews, setRecentNews] = useState<Post[]>([]);
    const [newsArticles, setNewsArticles] = useState<Post[]>([]);
    const [atlantaNews, setAtlantaNews] = useState<Post[]>([]);
    const [usNews, setUsNews] = useState<Post[]>([]);
    const [worldNews, setWorldNews] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newsCategoryId, setNewsCategoryId] = useState<string | null>(null);
    const [nextNewsOffset, setNextNewsOffset] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
                const categories = categoriesResponse.data || [];

                const found = categories.find((category: any) =>
                    category.name?.toLowerCase() === Categories.NEWS.toLowerCase()
                );
                const categoryId = typeof found?._id === 'string' ? found._id : null;
                setNewsCategoryId(categoryId);

                if (!categoryId) {
                    if (!isMounted) return;
                    setNewsArticles([]);
                    setError('News category not found.');
                    return;
                }

                const newsResponse = await articleService.fetchArticleFeed(
                    {
                        category: categoryId,
                        limit: MAIN_SECTION_LIMIT,
                        offset: 0,
                        status: 'published',
                    },
                    controller.signal
                );

                const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
                const allNewsArticles = mapResponseData(newsResponse.data);
                setNextNewsOffset(newsResponse.nextOffset ?? allNewsArticles.length);
                const getTimestamp = (post: Post) => {
                    const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                    const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                    return Math.max(published, created);
                };
                const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

                const stickyPosts = allNewsArticles.filter((post) => post.isSticky).sort(sortByPublishedDesc);
                const nonStickyPosts = allNewsArticles.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
                const orderedNews = [...stickyPosts, ...nonStickyPosts];
                const normalizeSubcategory = (value?: string) =>
                    typeof value === 'string' ? value.trim().toLowerCase() : '';
                const matchesSubcategory = (post: Post, target: string) => {
                    const normalizedTarget = normalizeSubcategory(target);
                    if (!normalizedTarget) return false;
                    return Array.isArray(post.subcategories) &&
                        post.subcategories.some((sub: any) => normalizeSubcategory(sub?.value) === normalizedTarget);
                };

                const seenIds = new Set<string>();
                const takeArticles = (limit: number, predicate: (post: Post) => boolean = () => true) => {
                    if (limit <= 0) {
                        return [];
                    }
                    const picked: Post[] = [];
                    for (const post of orderedNews) {
                        if (picked.length >= limit) break;
                        if (seenIds.has(post.id)) continue;
                        if (!predicate(post)) continue;
                        picked.push(post);
                        seenIds.add(post.id);
                    }
                    return picked;
                };

                const recentSelection = takeArticles(Math.max(RECENT_MIN_COUNT, stickyPosts.length));
                const atlantaStories = takeArticles(ATLANTA_SECTION_LIMIT, (post) =>
                    matchesSubcategory(post, 'atlanta news')
                );
                const usStories = takeArticles(US_SECTION_LIMIT, (post) => matchesSubcategory(post, 'us news'));
                const worldStories = takeArticles(WORLD_SECTION_LIMIT, (post) =>
                    matchesSubcategory(post, 'world news')
                );

                const remainingNews = orderedNews.filter((post) => !seenIds.has(post.id));

                if (!isMounted) {
                    return;
                }

                setRecentNews(recentSelection);
                setAtlantaNews(atlantaStories);
                setUsNews(usStories);
                setWorldNews(worldStories);
                setNewsArticles(remainingNews);
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
                    <div className='flex flex-col gap-4'>
                        {recentNews[0] && <JustInBlock post={recentNews[0]} />}
                        {recentNews[1] && <FeaturedStory post={recentNews[1]} height='695px' />}
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Atlanta News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {atlantaNews[0] && <ArticleBlock post={atlantaNews[0]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {atlantaNews[1] && <ArticleBlock post={atlantaNews[1]} height='222px' />}
                            {atlantaNews[2] && <ArticleBlock post={atlantaNews[2]} height='222px' />}
                            <div className='col-span-2'>
                                {atlantaNews[3] && <ArticleBlock post={atlantaNews[3]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const posts = atlantaNews.slice(6, 8);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const posts = atlantaNews.slice(8, 10);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {usNews.slice(0, 4).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const posts = usNews.slice(14, 18);
                                return posts.length ? <SideArticle posts={posts} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">World News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {worldNews.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <InfiniteScrollModule
                        categoryId={newsCategoryId ?? undefined}
                        startOffset={nextNewsOffset}
                    />
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    {(() => {
                        const posts = newsArticles.slice(0, 3);
                        return posts.length ? (
                            <SideArticle posts={posts} width='80px' hasDesc={true}/>
                        ) : null;
                    })()}
                    <VerticalAd ad={MockAd} />
                </div>
            </div>
        </>
    )
}

export default News
