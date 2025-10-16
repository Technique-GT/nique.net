import { useEffect, useState } from 'react'
import articleService from '../services/articleService';
import { Categories } from '../types/categories';
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
import VerticalAd from "../components/VerticalAd";
import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import InstagramEmbed from '../components/InstaEmbed';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';

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

function Sports() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentSportsArticles, setRecentSportsArticles] = useState<Post[]>([]);
    const [sportsArticles, setSportsArticles] = useState<Post[]>([]);
    const [techSports, setTechSports] = useState<Post[]>([]);
    const [usSports, setUsSports] = useState<Post[]>([]);
    const [seasonScoreboard, setSeasonScoreboard] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);

        useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
                const categories = categoriesResponse.data || [];
                const sportsCategory = categories.find((category: any) =>
                    category.name?.toLowerCase() === Categories.SPORTS.toLowerCase()
                );

                if (!sportsCategory?._id) {
                    if (!isMounted) return;
                    setSportsArticles([]);
                    setError('Sports category not found.');
                    return;
                }

                const sportsResponse = await articleService.fetchArticlesByCategory(
                    sportsCategory._id,
                    undefined,
                    controller.signal
                );

                const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
                const allSportsArticles = mapResponseData(sportsResponse.data);
                const getTimestamp = (post: Post) => {
                    const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                    const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                    return Math.max(published, created);
                };
                const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

                const stickyPosts = allSportsArticles.filter((post) => post.isSticky).sort(sortByPublishedDesc);
                const nonStickyPosts = allSportsArticles.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
                const orderedSports = [...stickyPosts, ...nonStickyPosts];
                const RECENT_COUNT = Math.max(5, stickyPosts.length);
                const recentSelection = orderedSports.slice(0, RECENT_COUNT);
                const remainingSports = orderedSports.slice(RECENT_COUNT);
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

                setRecentSportsArticles(recentSelection);
                setSportsArticles(remainingSports);
                setTechSports(filterBySubcategory(sportsResponse.data || [], 'tech sports'));
                setUsSports(filterBySubcategory(sportsResponse.data || [], 'us sports'));
                setSeasonScoreboard(filterBySubcategory(sportsResponse.data || [], 'season scoreboard'));
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
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[auto_35%] w-full'>
                        <div className='flex flex-col gap-4'>
                            {recentSportsArticles[0] && <ArticleBlock post={recentSportsArticles[0]} height='768px' />}
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1'>
                            {recentSportsArticles[1] && <ArticleBlock post={recentSportsArticles[1]} height='180px' />}
                            {recentSportsArticles[2] && <ArticleBlock post={recentSportsArticles[2]} height='180px' />}
                            {recentSportsArticles[3] && <ArticleBlock post={recentSportsArticles[3]} height='180px' />}
                            {recentSportsArticles[4] && <ArticleBlock post={recentSportsArticles[4]} height='180px' />}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Tech Sports</h4>
                    <div className='grid grid-cols-1 lg:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            {(() => {
                                const posts = techSports.slice(0, 4);
                                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                            })()}
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                            {techSports.slice(4, 8).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='190px' />
                            ))}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. Sports</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {usSports.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='180px' />
                        ))}
                    </div>
                </div>

                <div className='flex flex-col'>
                    <InstagramEmbed username="gtathletics" />
                    <hr className='my-3 border-nique-blue' />
                    <VerticalAd ad={MockAd} />
                    <hr className='my-3 border-nique-blue' />
                    <h4 className="text-nique-blue font-bold mb-4 text-2xl">Season Scoreboard</h4>
                    {(() => {
                        const posts = seasonScoreboard.slice(0, 5);
                        return posts.length ? <SideArticle posts={posts} /> : null;
                    })()}
                </div>
            </div>
        </>
    )
}

export default Sports
