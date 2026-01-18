import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
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

function Entertainment() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentEntertainment, setRecentEntertainment] = useState<ArticleDocument[]>([]);
    const [entertainmentArticles, setEntertainmentArticles] = useState<ArticleDocument[]>([]);
    const [filmtv, setFilmAndTV] = useState<ArticleDocument[]>([]);
    const [music, setMusic] = useState<ArticleDocument[]>([]);
    const [artsTheater, setArtsTheater] = useState<ArticleDocument[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [entertainmentCategoryId, setEntertainmentCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadArticles = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Services now return unwrapped data directly
            const categories = await articleService.fetchCategories(50, controller.signal);

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

            if (!isMounted) {
                return;
            }

            setRecentEntertainment(recentSelection);
            setEntertainmentArticles(remainingEntertainment);
            setFilmAndTV(filterBySubcategory(entertainmentResponse || [], 'film & tv'));
            setMusic(filterBySubcategory(entertainmentResponse || [], 'music'));
            setArtsTheater(filterBySubcategory(entertainmentResponse || [], 'arts & theater'));

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
                    className="rounded-md w-full h-[550px]"
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
