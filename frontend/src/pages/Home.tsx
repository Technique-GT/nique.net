import { useEffect, useMemo, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import { Categories } from '../types/categories';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { mapArticleToPost } from '../utils/articleMapping';

function Home() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentArticles, setRecentArticles] = useState<Post[]>([]);
    const [lifeArticles, setLifeArticles] = useState<Post[]>([]);
    const [newsArticles, setNewsArticles] = useState<Post[]>([]);
    const [entertainmentArticles, setEntertainmentArticles] = useState<Post[]>([]);
    const [opinionArticles, setOpinionArticles] = useState<Post[]>([]);
    const [sportsArticles, setSportsArticles] = useState<Post[]>([]);
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

                const findCategoryId = (name: string) => {
                    const match = categories.find((category: any) => category.name?.toLowerCase() === name.toLowerCase());
                    return match?._id || null;
                };

                const lifeCategoryId = findCategoryId(Categories.LIFE);
                const newsCategoryId = findCategoryId(Categories.NEWS);
                const entertainmentCategoryId = findCategoryId(Categories.ENTERTAINMENT);
                const opinionCategoryId = findCategoryId(Categories.OPINION);
                const sportsCategoryId = findCategoryId(Categories.SPORTS);

                const [
                    stickyResponse,
                    recentResponse,
                    lifeResponse,
                    newsResponse,
                    entertainmentResponse,
                    opinionResponse,
                    sportsResponse,
                ] = await Promise.all([
                    articleService.fetchStickyArticles(undefined, controller.signal),
                    articleService.fetchRecentArticles(5, 'published', controller.signal),
                    lifeCategoryId
                        ? articleService.fetchArticles({ category: lifeCategoryId, limit: 15, status: 'published' }, controller.signal)
                        : Promise.resolve({ data: [] }),
                    newsCategoryId
                        ? articleService.fetchArticles({ category: newsCategoryId, limit: 15, status: 'published' }, controller.signal)
                        : Promise.resolve({ data: [] }),
                    entertainmentCategoryId
                        ? articleService.fetchArticles({ category: entertainmentCategoryId, limit: 15, status: 'published' }, controller.signal)
                        : Promise.resolve({ data: [] }),
                    opinionCategoryId
                        ? articleService.fetchArticles({ category: opinionCategoryId, limit: 15, status: 'published' }, controller.signal)
                        : Promise.resolve({ data: [] }),
                    sportsCategoryId
                        ? articleService.fetchArticles({ category: sportsCategoryId, limit: 15, status: 'published' }, controller.signal)
                        : Promise.resolve({ data: [] }),
                ]);

                if (!isMounted) {
                    return;
                }

                const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
                const stickyPosts = mapResponseData(stickyResponse.data);
                const recentPosts = mapResponseData(recentResponse.data);
                const lifePosts = mapResponseData(lifeResponse.data);
                const newsPosts = mapResponseData(newsResponse.data);
                const entertainmentPosts = mapResponseData(entertainmentResponse.data);
                const opinionPosts = mapResponseData(opinionResponse.data);
                const sportsPosts = mapResponseData(sportsResponse.data);

                const sortByPublishedDesc = (a: Post, b: Post) => {
                    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                    return dateB - dateA;
                };

                const stickySorted = stickyPosts.filter((post) => post.isSticky).sort(sortByPublishedDesc);
                const stickyIds = new Set(stickySorted.map((post) => post.id));
                const nonStickyRecent = recentPosts.filter((post) => !stickyIds.has(post.id)).sort(sortByPublishedDesc);
                const sortedRecent = [...stickySorted, ...nonStickyRecent];
                const recentIds = new Set(sortedRecent.map((post) => post.id));
                const filterAndSort = (posts: Post[]) => posts.filter((post) => !recentIds.has(post.id)).sort(sortByPublishedDesc);

                setRecentArticles(sortedRecent);
                setLifeArticles(filterAndSort(lifePosts));
                setNewsArticles(filterAndSort(newsPosts));
                setEntertainmentArticles(filterAndSort(entertainmentPosts));
                setOpinionArticles(filterAndSort(opinionPosts));
                setSportsArticles(filterAndSort(sportsPosts)); 
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

    const sideArticles = useMemo(() => { 
        return opinionArticles.slice(0, 3);
    }, [opinionArticles]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner/>
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
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] w-full'>
                        <div className='flex flex-col gap-4 order-last lg:order-first'>
                            {recentArticles.slice(2, 6).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='200px' />
                            ))}
                        </div>
                        <div className='flex flex-col gap-4'>
                            {recentArticles[0] && <JustInBlock post={recentArticles[0]} />}
                            {recentArticles[1] && <FeaturedStory post={recentArticles[1]} height='695px' />}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.LIFE}</h4>
                    <div className='grid grid-cols-2 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            {lifeArticles[0] && <ArticleBlock post={lifeArticles[0]} height='396px' />}
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            {lifeArticles.slice(1,3).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='190px' />
                            ))}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.NEWS}</h4>
                    <div className='grid grid-cols-3 sm:flex-row gap-4'>
                        {newsArticles.slice(0,3).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='200px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {entertainmentArticles.slice(0, 8).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.SPORTS}</h4>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                            {sportsArticles[0] && <ArticleBlock post={sportsArticles[0]} height="396px" />}
                        </div>
                        <div className="sm:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                            {sportsArticles.slice(1, 5).map((article) => (
                            <ArticleBlock key={article.id} post={article} height="190px" />
                            ))}
                        </div>
                    </div>

                    <InfiniteScrollModule />
                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle posts={sideArticles}/>
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/6hWrY7npl9UIbUzlRgpwoo?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Home
