import { useEffect, useMemo, useState } from 'react';
import articleService from '../services/articleService';
import { categoryCache } from '../services/categoryCache';
import ArticleBlock from "../components/ArticleBlock";
import { ArticleDocument } from '../types/article';
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import { Categories } from '../types/categories';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

function Home() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentArticles, setRecentArticles] = useState<ArticleDocument[]>([]);
    const [featuredArticle, setFeaturedArticle] = useState<ArticleDocument | null>(null);
    const [lifeArticles, setLifeArticles] = useState<ArticleDocument[]>([]);
    const [newsArticles, setNewsArticles] = useState<ArticleDocument[]>([]);
    const [entertainmentArticles, setEntertainmentArticles] = useState<ArticleDocument[]>([]);
    const [opinionArticles, setOpinionArticles] = useState<ArticleDocument[]>([]);
    const [sportsArticles, setSportsArticles] = useState<ArticleDocument[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Services now return unwrapped data directly
                const categories = await articleService.fetchCategories(50, controller.signal);

                const findCategoryId = (name: string) => {
                    const match = categories.find((category) => category.name?.toLowerCase() === name.toLowerCase());
                    return match?._id || null;
                };

                const lifeCategoryId = findCategoryId(Categories.LIFE);
                const newsCategoryId = findCategoryId(Categories.NEWS);
                const entertainmentCategoryId = findCategoryId(Categories.ENTERTAINMENT);
                const opinionCategoryId = findCategoryId(Categories.OPINION);
                const sportsCategoryId = findCategoryId(Categories.SPORTS);

                const [
                    stickyArticles,
                    featuredArticles,
                    recentArticlesData,
                    lifeArticlesData,
                    newsArticlesData,
                    entertainmentArticlesData,
                    opinionArticlesData,
                    sportsArticlesData,
                ] = await Promise.all([
                    articleService.fetchStickyArticles(undefined, controller.signal),
                    articleService.fetchFeaturedArticles(controller.signal),
                    articleService.fetchRecentArticles(5, 'published', controller.signal),
                    lifeCategoryId
                        ? articleService.fetchArticlesByCategory(lifeCategoryId, undefined, controller.signal)
                        : Promise.resolve([] as ArticleDocument[]),
                    newsCategoryId
                        ? articleService.fetchArticlesByCategory(newsCategoryId, undefined, controller.signal)
                        : Promise.resolve([] as ArticleDocument[]),
                    entertainmentCategoryId
                        ? articleService.fetchArticlesByCategory(entertainmentCategoryId, undefined, controller.signal)
                        : Promise.resolve([] as ArticleDocument[]),
                    opinionCategoryId
                        ? articleService.fetchArticlesByCategory(opinionCategoryId, undefined, controller.signal)
                        : Promise.resolve([] as ArticleDocument[]),
                    sportsCategoryId
                        ? articleService.fetchArticlesByCategory(sportsCategoryId, undefined, controller.signal)
                        : Promise.resolve([] as ArticleDocument[]),
                ]);

                if (!isMounted) {
                    return;
                }

                // Populate cache for instant navigation to category pages
                categoryCache.setCategories(categories);
                categoryCache.setStickyArticles(stickyArticles || []);
                categoryCache.setFeaturedArticles(featuredArticles || []);
                categoryCache.setCategoryArticles(Categories.LIFE, lifeArticlesData || []);
                categoryCache.setCategoryArticles(Categories.NEWS, newsArticlesData || []);
                categoryCache.setCategoryArticles(Categories.ENTERTAINMENT, entertainmentArticlesData || []);
                categoryCache.setCategoryArticles(Categories.OPINION, opinionArticlesData || []);
                categoryCache.setCategoryArticles(Categories.SPORTS, sportsArticlesData || []);

                const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
                    getArticleTimestamp(b) - getArticleTimestamp(a);

                const stickySorted = (stickyArticles || []).filter((article) => article.isSticky).sort(sortByPublishedDesc);
                const featuredSorted = (featuredArticles || []).filter((article) => article.isFeatured).sort(sortByPublishedDesc);
                const latestFeatured = featuredSorted[0] ?? null;
                const stickyIds = new Set(stickySorted.map(getArticleId));
                const nonStickyRecent = (recentArticlesData || [])
                    .filter((article) => !stickyIds.has(getArticleId(article)))
                    .sort(sortByPublishedDesc);
                const sortedRecent = [...stickySorted, ...nonStickyRecent];
                const recentIds = new Set(sortedRecent.map(getArticleId));
                const filterAndSort = (articles: ArticleDocument[]) =>
                    articles.filter((article) => !recentIds.has(getArticleId(article))).sort(sortByPublishedDesc);

                setRecentArticles(sortedRecent);
                setFeaturedArticle(latestFeatured);
                setLifeArticles(filterAndSort(lifeArticlesData));
                setNewsArticles(filterAndSort(newsArticlesData));
                setEntertainmentArticles(filterAndSort(entertainmentArticlesData));
                setOpinionArticles(filterAndSort(opinionArticlesData));
                setSportsArticles(filterAndSort(sportsArticlesData)); 
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
        return opinionArticles.slice(0, 4);
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
            <div className='max-w-[95%] md:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div className='w-full'>
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] lg:grid-rows-4 w-full h-[80vh]'>
                        <div className='flex flex-col gap-4 order-last lg:order-first lg:row-span-4'>
                            {recentArticles.slice(2, 6).map((article) => (
                                <ArticleBlock key={article._id || article.slug} article={article} height='100%'/>
                            ))}
                        </div>
                        <div className='flex flex-col gap-4 row-span-4 h-full'>
                            {recentArticles[0] && <JustInBlock article={recentArticles[0]} />}
                            {featuredArticle && <FeaturedStory article={featuredArticle} />}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.LIFE}</h4>
                    <div className='grid grid-cols-2 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            {lifeArticles[0] && <ArticleBlock article={lifeArticles[0]} height='396px' />}
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            {lifeArticles.slice(1,3).map((article) => (
                                <ArticleBlock key={article._id || article.slug} article={article} height='190px' />
                            ))}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.NEWS}</h4>
                    <div className='grid grid-cols-3 sm:flex-row gap-4'>
                        {newsArticles.slice(0,3).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height='200px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {entertainmentArticles.slice(0, 8).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.SPORTS}</h4>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                            {sportsArticles[0] && <ArticleBlock article={sportsArticles[0]} height="396px" />}
                        </div>
                        <div className="sm:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                            {sportsArticles.slice(1, 5).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height="190px" />
                            ))}
                        </div>
                    </div>

                    <InfiniteScrollModule />
                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle articles={sideArticles}/>
                    <iframe className="rounded-md w-full h-137.5" src="https://open.spotify.com/embed/playlist/6hWrY7npl9UIbUzlRgpwoo?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Home
