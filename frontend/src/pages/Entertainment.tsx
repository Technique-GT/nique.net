import { useEffect, useState, useMemo } from 'react';
import articleService from '../services/articleService';
import { categoryCache } from '../services/categoryCache';
import ArticleBlock from "../components/ArticleBlock";
import { ArticleDocument } from '../types/article';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { Categories } from '../types/categories';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

// Helper to process raw articles into page sections
const processEntertainmentArticles = (allEntertainment: ArticleDocument[]) => {
    const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
        getArticleTimestamp(b) - getArticleTimestamp(a);

    const stickyPosts = allEntertainment.filter((article) => article.isSticky).sort(sortByPublishedDesc);
    const nonStickyPosts = allEntertainment.filter((article) => !article.isSticky).sort(sortByPublishedDesc);
    const orderedEntertainment = [...stickyPosts, ...nonStickyPosts];
    const recentSelection = orderedEntertainment.slice(0, 3);
    const recentIds = new Set(recentSelection.map(getArticleId));
    const remainingEntertainment = orderedEntertainment.filter((article) => !recentIds.has(getArticleId(article)));

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
        recentEntertainment: recentSelection,
        entertainmentArticles: remainingEntertainment,
        filmtv: filterBySubcategory(allEntertainment, 'film & tv'),
        music: filterBySubcategory(allEntertainment, 'music'),
        artsTheater: filterBySubcategory(allEntertainment, 'arts & theater'),
    };
};

function Entertainment() {
    // Check cache immediately for instant display
    const cachedArticles = useMemo(() => categoryCache.getCategoryArticles(Categories.ENTERTAINMENT), []);
    const initialData = useMemo(() => cachedArticles ? processEntertainmentArticles(cachedArticles) : null, [cachedArticles]);

    const [isLoading, setIsLoading] = useState<boolean>(!initialData);
    const [recentEntertainment, setRecentEntertainment] = useState<ArticleDocument[]>(initialData?.recentEntertainment || []);
    const [entertainmentArticles, setEntertainmentArticles] = useState<ArticleDocument[]>(initialData?.entertainmentArticles || []);
    const [filmtv, setFilmAndTV] = useState<ArticleDocument[]>(initialData?.filmtv || []);
    const [music, setMusic] = useState<ArticleDocument[]>(initialData?.music || []);
    const [artsTheater, setArtsTheater] = useState<ArticleDocument[]>(initialData?.artsTheater || []);
    const [error, setError] = useState<string | null>(null);
    const [entertainmentCategoryId, setEntertainmentCategoryId] = useState<string | null>(categoryCache.getCategoryId(Categories.ENTERTAINMENT));

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
                // Use cached categories if available
                let categories = categoryCache.getCategories();
                if (!categories) {
                    categories = await articleService.fetchCategories(50, controller.signal);
                    categoryCache.setCategories(categories);
                }

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

                const entertainmentResponse = await articleService.fetchArticlesByCategory(
                    entertainmentCategory._id,
                    undefined,
                    controller.signal
                );

                const allEntertainment = entertainmentResponse || [];
                
                // Update cache with fresh data
                categoryCache.setCategoryArticles(Categories.ENTERTAINMENT, allEntertainment);

                if (!isMounted) {
                    return;
                }

                const processed = processEntertainmentArticles(allEntertainment);
                setRecentEntertainment(processed.recentEntertainment);
                setEntertainmentArticles(processed.entertainmentArticles);
                setFilmAndTV(processed.filmtv);
                setMusic(processed.music);
                setArtsTheater(processed.artsTheater);
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
        <div className='max-w-[95%] md:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
            <div className='w-full'>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-4 m-0'>
                {recentEntertainment.slice(0, 4).length > 0 && (
                    <Carousel articles={recentEntertainment.slice(0, 3)} width='70%'/>
                )}
                </div>
            </div>
            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Music</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-2 sm:col-span-2'>
                {music[0] && <ArticleBlock article={music[0]} height='400px'/>}
                </div>

                <div className='grid gap-4 grid-cols-2 lg:col-span-2'>
                {music.slice(1, 5).map((article) => (
                    <ArticleBlock key={article._id || article.slug} article={article} height='190px' />
                ))}
                </div>
            </div>

            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Film & TV</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                {filmtv.slice(0, 4).map((article) => (
                <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                ))}
            </div>

            <hr className='my-3' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Arts & Theater</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                {(() => {
                const articles = artsTheater.slice(0, 2);
                return articles.length ? <SmallArticle articles={articles} direction="left"/> : null;
                })()}
                {(() => {
                const articles = artsTheater.slice(2, 4);
                return articles.length ? <SmallArticle articles={articles} direction="left"/> : null;
                })()}
            </div>

            <InfiniteScrollModule categoryId={entertainmentCategoryId ?? undefined} />
            </div>

            <div className='flex flex-col gap-4'>
                <iframe
                    className="rounded-md w-full h-137.5"
                    src="https://open.spotify.com/embed/playlist/6hWrY7npl9UIbUzlRgpwoo?utm_source=generator"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                />
                {(() => {
                    const articles = entertainmentArticles.slice(0, 5)
                    .filter(Boolean) as ArticleDocument[];
                    return articles.length ? <SideArticle articles={articles} width='28%'/> : null;
                })()}
            </div>
        </div>
        </>
    )
}

export default Entertainment;
