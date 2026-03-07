import { useEffect, useState } from 'react'
import articleService from '../services/articleService';
import { Categories } from '../types/categories';
import ArticleBlock from "../components/ArticleBlock"
import { ArticleDocument, Category } from '../types/article'
import FeaturedStory from '../components/FeaturedStory';
import SideArticle from '../components/SideArticle';
import InstaEmbed from '../components/InstaEmbed';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

// Helper to process raw articles into page sections
const processSportsArticles = (allSportsArticles: ArticleDocument[]) => {
    const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
        getArticleTimestamp(b) - getArticleTimestamp(a);

    const stickyPosts = allSportsArticles.filter((article) => article.isSticky).sort(sortByPublishedDesc);
    const featuredPosts = allSportsArticles.filter((article) => article.isFeatured).sort(sortByPublishedDesc);
    const nonStickyPosts = allSportsArticles.filter((article) => !article.isSticky).sort(sortByPublishedDesc);
    const orderedSports = [...stickyPosts, ...nonStickyPosts];

    const featured = featuredPosts[0] ?? null;
    const orderedWithoutFeatured = featured
        ? orderedSports.filter((article) => getArticleId(article) !== getArticleId(featured))
        : orderedSports;
    const recentSelection = [featured, ...orderedWithoutFeatured].filter(Boolean) as ArticleDocument[];
    const visibleRecent = recentSelection.slice(0, 5);
    const recentIds = new Set(visibleRecent.map(getArticleId));

    const filterBySubcategory = (articles: ArticleDocument[], subcategory: string) =>
        articles
            .filter((article) => {
                if (article.subcategoryId && typeof article.subcategoryId === 'object') {
                    return article.subcategoryId.name?.toLowerCase() === subcategory.toLowerCase();
                }
                return false;
            })
            .filter((article) => !recentIds.has(getArticleId(article)))
            .sort(sortByPublishedDesc);

    return {
        recentSportsArticles: visibleRecent,
        techSports: filterBySubcategory(allSportsArticles, 'jackets'),
        atlSports: filterBySubcategory(allSportsArticles, 'atlanta'),
        seasonScoreboard: [] as ArticleDocument[], // No corresponding backend subcategory
    };
};

function Sports() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentSportsArticles, setRecentSportsArticles] = useState<ArticleDocument[]>([]);
    const [techSports, setTechSports] = useState<ArticleDocument[]>([]);
    const [atlSports, setAtlSports] = useState<ArticleDocument[]>([]);
    const [seasonScoreboard, setSeasonScoreboard] = useState<ArticleDocument[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sportsCategoryId, setSportsCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categories = await articleService.fetchCategories(50, controller.signal);

                const sportsCategory = categories.find((category: Category) =>
                    category.name?.toLowerCase() === Categories.SPORTS.toLowerCase()
                );
                setSportsCategoryId(typeof sportsCategory?._id === 'string' ? sportsCategory._id : null);

                if (!sportsCategory?._id) {
                    if (!isMounted) return;
                    setError('Sports category not found.');
                    return;
                }

                const sportsResponse = await articleService.fetchArticlesByCategory(
                    sportsCategory._id,
                    undefined,
                    controller.signal
                );

                const allSportsArticles = sportsResponse || [];

                if (!isMounted) {
                    return;
                }

                const processed = processSportsArticles(allSportsArticles);
                setRecentSportsArticles(processed.recentSportsArticles);
                setTechSports(processed.techSports);
                setAtlSports(processed.atlSports);
                setSeasonScoreboard(processed.seasonScoreboard);
            } catch {
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
            <div className='max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div className='w-full min-h-screen'>
                    {/* Main */}
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[auto_35%] lg:grid-rows-4 w-full h-[80vh]'>
                        <div className='flex flex-col gap-4 lg:row-span-4'>
                            {recentSportsArticles[0] && <FeaturedStory article={recentSportsArticles[0]} height="100%" />}
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-4 lg:row-span-4 h-full'>
                            {recentSportsArticles[1] && <ArticleBlock article={recentSportsArticles[1]} height="100%" />}
                            {recentSportsArticles[2] && <ArticleBlock article={recentSportsArticles[2]} height="100%" />}
                            {recentSportsArticles[3] && <ArticleBlock article={recentSportsArticles[3]} height="100%" />}
                            {recentSportsArticles[4] && <ArticleBlock article={recentSportsArticles[4]} height="100%" />}
                        </div>
                    </div>

                    <hr className='my-3' />

                    {/* Subcategories */}
                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Jackets</h4>
                    <div className='grid grid-cols-1 lg:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            {(() => {
                                const articles = techSports.slice(0, 4);
                                return articles.length ? <SmallArticle articles={articles} direction="left"/> : null;
                            })()}
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                            {techSports.slice(4, 8).map((article) => (
                                <ArticleBlock key={article._id || article.slug} article={article} height='190px' />
                            ))}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Atlanta</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {atlSports.slice(0, 4).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height='180px' />
                        ))}
                    </div>

                    <InfiniteScrollModule categoryId={sportsCategoryId ?? undefined}  />
                </div>

                <div className='flex flex-col'>
                    <InstaEmbed username="gt_nique" />
                    <hr className='my-3' />
                    {/* <VerticalAd ad={MockAd} />
                    <hr className='my-3' /> */}
                    <h4 className="text-nique-blue font-bold mb-4 text-2xl">Season Scoreboard</h4>
                    {(() => {
                        const articles = seasonScoreboard.slice(0, 5);
                        return articles.length ? <SideArticle articles={articles} /> : null;
                    })()}
                </div>
            </div>
        </>
    )
}

export default Sports
