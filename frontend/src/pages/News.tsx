import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { ArticleDocument, Category } from '../types/article';
import { Categories } from '../types/categories';
import FeaturedStory from '../components/FeaturedStory';
// import MockAd from '../assets/mock_advertisement.jpg';
import JustInBlock from '../components/JustIn';
import SideArticle from '../components/SideArticle';
import SmallArticle from '../components/SmallArticle';
// import VerticalAd from '../components/VerticalAd';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

// Helper to process raw articles into page sections
const processNewsArticles = (allNewsArticles: ArticleDocument[]) => {
    const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
        getArticleTimestamp(b) - getArticleTimestamp(a);

    const stickyPosts = allNewsArticles.filter((article) => article.isSticky).sort(sortByPublishedDesc);
    const featuredPosts = allNewsArticles.filter((article) => article.isFeatured).sort(sortByPublishedDesc);
    const nonStickyPosts = allNewsArticles.filter((article) => !article.isSticky).sort(sortByPublishedDesc);
    const orderedNews = [...stickyPosts, ...nonStickyPosts];

    const justIn = stickyPosts[0] ?? orderedNews[0] ?? null;
    const featured = featuredPosts.find((article) => getArticleId(article) !== getArticleId(justIn)) ?? null;
    const recentSelection = [justIn, featured].filter(Boolean) as ArticleDocument[];
    const recentIds = new Set(recentSelection.map(getArticleId));
    const sideNewsArticles = orderedNews.filter((article) => !recentIds.has(getArticleId(article))).slice(0, 5);
    const sideIds = new Set(sideNewsArticles.map(getArticleId));
    const excludedIds = new Set([...recentIds, ...sideIds]);

    const filterBySubcategory = (articles: ArticleDocument[], subcategory: string) =>
        articles
            .filter((article) => {
                if (article.subcategoryId && typeof article.subcategoryId === 'object') {
                    return article.subcategoryId.name?.toLowerCase() === subcategory.toLowerCase();
                }
                return false;
            })
            .filter((article) => !excludedIds.has(getArticleId(article)))
            .sort(sortByPublishedDesc);

    return {
        recentNews: recentSelection,
        sideNewsArticles,
        theInstituteNews: filterBySubcategory(allNewsArticles, 'the institute'),
        cityStateNews: filterBySubcategory(allNewsArticles, 'city & state'),
        scienceResearchNews: filterBySubcategory(allNewsArticles, 'science & research'),
    };
};

function News() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentNews, setRecentNews] = useState<ArticleDocument[]>([]);
    const [sideNewsArticles, setSideNewsArticles] = useState<ArticleDocument[]>([]);
    const [theInstituteNews, setTheInstituteNews] = useState<ArticleDocument[]>([]);
    const [cityStateNews, setCityStateNews] = useState<ArticleDocument[]>([]);
    const [scienceResearchNews, setScienceResearchNews] = useState<ArticleDocument[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newsCategoryId, setNewsCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categories = await articleService.fetchCategories(50, controller.signal);

                const newsCategory = categories.find((category: Category) =>
                    category.name?.toLowerCase() === Categories.NEWS.toLowerCase()
                );
                const categoryId = typeof newsCategory?._id === 'string' ? newsCategory._id : null;
                setNewsCategoryId(categoryId);

                if (!categoryId) {
                    if (!isMounted) return;
                    setSideNewsArticles([]);
                    setError('News category not found.');
                    return;
                }

                const newsResponse = await articleService.fetchArticlesByCategory(
                    categoryId,
                    undefined,
                    controller.signal
                );

                const allNewsArticles = newsResponse || [];

                if (!isMounted) {
                    return;
                }

                const processed = processNewsArticles(allNewsArticles);
                setRecentNews(processed.recentNews);
                setSideNewsArticles(processed.sideNewsArticles);
                setTheInstituteNews(processed.theInstituteNews);
                setCityStateNews(processed.cityStateNews);
                setScienceResearchNews(processed.scienceResearchNews);
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
            <div className='max-w-[95%] lg:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div>
                    {/* Main */}
                    <div className='flex flex-col gap-4 h-[80vh]'>
                        {recentNews[0] && <JustInBlock article={recentNews[0]} />}
                        {recentNews[1] && <FeaturedStory article={recentNews[1]} priority={true} />}
                    </div>

                    <hr className='my-3' />

                    {/* Subcategories */}
                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">The Institute</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {theInstituteNews[0] && <ArticleBlock article={theInstituteNews[0]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {theInstituteNews[1] && <ArticleBlock article={theInstituteNews[1]} height='222px' />}
                            {theInstituteNews[2] && <ArticleBlock article={theInstituteNews[2]} height='222px' />}
                            <div className='col-span-2'>
                                {theInstituteNews[3] && <ArticleBlock article={theInstituteNews[3]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const articles = theInstituteNews.slice(6, 8);
                                return articles.length ? <SmallArticle articles={articles} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const articles = theInstituteNews.slice(8, 10);
                                return articles.length ? <SmallArticle articles={articles} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">City & State</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {cityStateNews.slice(0, 4).map((article) => (
                                <ArticleBlock key={article._id || article.slug} article={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const articles = cityStateNews.slice(4, 8);
                                return articles.length ? <SideArticle articles={articles} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Science & Research</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {scienceResearchNews.slice(0, 6).map((article) => (
                            <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                        ))}
                    </div>

                    <InfiniteScrollModule categoryId={newsCategoryId ?? undefined} />
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    {(() => {
                        const articles = sideNewsArticles.slice(0, 5);
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

export default News
