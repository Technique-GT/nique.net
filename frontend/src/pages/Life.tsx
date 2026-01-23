import { useEffect, useState, useMemo } from 'react';
import articleService from '../services/articleService';
import { categoryCache } from '../services/categoryCache';
import ArticleBlock from "../components/ArticleBlock";
import { ArticleDocument } from '../types/article';
import { Categories } from '../types/categories';
import SideArticle from '../components/SideArticle';
import FeaturedStory from '../components/FeaturedStory';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

// Helper to process raw articles into page sections
const processLifeArticles = (allLifeArticles: ArticleDocument[]) => {
    const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
        getArticleTimestamp(b) - getArticleTimestamp(a);

    const stickyPosts = allLifeArticles.filter((article) => article.isSticky).sort(sortByPublishedDesc);
    const featuredPosts = allLifeArticles.filter((article) => article.isFeatured).sort(sortByPublishedDesc);
    const nonStickyPosts = allLifeArticles.filter((article) => !article.isSticky).sort(sortByPublishedDesc);
    const orderedLife = [...stickyPosts, ...nonStickyPosts];

    const featured = featuredPosts[0] ?? null;
    const primaryStory = featured ?? orderedLife[0] ?? null;
    const recentSelection = [primaryStory].filter(Boolean) as ArticleDocument[];
    const recentIds = new Set(recentSelection.map(getArticleId));
    const remainingLife = orderedLife.filter((article) => !recentIds.has(getArticleId(article)));

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
        recentLifeArticles: recentSelection,
        lifeArticles: remainingLife,
        events: filterBySubcategory(allLifeArticles, 'events'),
        rsos: filterBySubcategory(allLifeArticles, 'rsos'),
        featuresArticles: filterBySubcategory(allLifeArticles, 'student features'),
    };
};

function Life() {
    // Check cache immediately for instant display
    const cachedArticles = useMemo(() => categoryCache.getCategoryArticles(Categories.LIFE), []);
    const initialData = useMemo(() => cachedArticles ? processLifeArticles(cachedArticles) : null, [cachedArticles]);

    const [isLoading, setIsLoading] = useState<boolean>(!initialData);
    const [recentLifeArticles, setRecentLifeArticles] = useState<ArticleDocument[]>(initialData?.recentLifeArticles || []);
    const [lifeArticles, setLifeArticles] = useState<ArticleDocument[]>(initialData?.lifeArticles || []);
    const [events, setEvents] = useState<ArticleDocument[]>(initialData?.events || []);
    const [rsos, setRsos] = useState<ArticleDocument[]>(initialData?.rsos || []);
    const [featuresArticles, setFeaturesArticles] = useState<ArticleDocument[]>(initialData?.featuresArticles || []);
    const [error, setError] = useState<string | null>(null);
    const [lifeCategoryId, setLifeCategoryId] = useState<string | null>(categoryCache.getCategoryId(Categories.LIFE));

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            // Only show loading if we don't have cached data
            if (!cachedArticles) {
                setIsLoading(true);
            }
            setError(null);

            try {
                // Services now return unwrapped data directly
                let categories = categoryCache.getCategories();
                if (!categories) {
                    categories = await articleService.fetchCategories(50, controller.signal);
                    categoryCache.setCategories(categories);
                }

                const lifeCategory = categories.find((category: any) =>
                    category.name?.toLowerCase() === Categories.LIFE.toLowerCase()
                );
                const categoryId = typeof lifeCategory?._id === 'string' ? lifeCategory._id : null;
                setLifeCategoryId(categoryId);

                if (!lifeCategory?._id) {
                    if (!isMounted) return;
                    setLifeArticles([]);
                    setError('Life category not found.');
                    return;
                }

                const lifeResponse = await articleService.fetchArticlesByCategory(
                    lifeCategory._id,
                    undefined,
                    controller.signal
                );

                const allLifeArticles = lifeResponse || [];
                
                // Update cache with fresh data
                categoryCache.setCategoryArticles(Categories.LIFE, allLifeArticles);

                if (!isMounted) {
                    return;
                }

                const processed = processLifeArticles(allLifeArticles);
                setRecentLifeArticles(processed.recentLifeArticles);
                setLifeArticles(processed.lifeArticles);
                setEvents(processed.events);
                setRsos(processed.rsos);
                setFeaturesArticles(processed.featuresArticles);
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                // Only show error if we don't have cached data to display
                if (!cachedArticles) {
                    setError('Unable to load articles. Please try again later.');
                }
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
    }, [cachedArticles]);
    
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
            <div className='max-w-[95%] lg:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div>
                    <div className='flex flex-col gap-4 h-[80vh]'>
                        {recentLifeArticles[0] && <FeaturedStory article={recentLifeArticles[0]} priority={true} />}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Events</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {events[0] && <ArticleBlock article={events[0]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {events[1] && <ArticleBlock article={events[1]} height='222px' />}
                            {events[2] && <ArticleBlock article={events[2]} height='222px' />}
                            <div className='col-span-2'>
                                {events[3] && <ArticleBlock article={events[3]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const articles = events.slice(6, 8);
                                return articles.length ? <SmallArticle articles={articles} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const articles = events.slice(8, 10);
                                return articles.length ? <SmallArticle articles={articles} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">RSOs</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {rsos.slice(0, 4).map((article) => (
                                <ArticleBlock key={article._id || article.slug} article={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const articles = rsos.slice(4, 8);
                                return articles.length ? <SideArticle articles={articles} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Features</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {featuresArticles.slice(0, 6).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                        ))}
                    </div>

                    <InfiniteScrollModule categoryId={lifeCategoryId ?? undefined} />
                </div>

                <div className='flex flex-col gap-4'>
                    <hr/>
                    {(() => {
                        const articles = lifeArticles.slice(0, 5);
                        return articles.length ? (
                            <SideArticle articles={articles} width='80px' hasDesc={true}/>
                        ) : null;
                    })()}
                    {/* <VerticalAd ad={MockAd} /> */}
                </div>
            </div>
        </>
    )
}

export default Life
