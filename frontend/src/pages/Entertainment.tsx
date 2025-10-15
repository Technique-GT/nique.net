import { useCallback } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import SmallArticle from '../components/SmallArticle';
import Comic from '../components/Comic';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { Categories } from '../types/categories';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

interface EntertainmentArticlesData {
    entertainmentArticles: Post[];
    moviesAndShows: Post[];
    music: Post[];
    books: Post[];
    comics: Post[];
}

const emptyEntertainmentData: EntertainmentArticlesData = {
    entertainmentArticles: [],
    moviesAndShows: [],
    music: [],
    books: [],
    comics: [],
};

function Entertainment() {
    const loadEntertainmentArticles = useCallback(async (signal: AbortSignal): Promise<EntertainmentArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];

        const entertainmentCategory = categories.find((category) =>
            category.name?.toLowerCase() === Categories.ENTERTAINMENT.toLowerCase()
        );

        if (!entertainmentCategory?._id) {
            throw new Error('Entertainment category not found.');
        }

        const entertainmentResponse = await articleService.fetchArticlesByCategory(
            entertainmentCategory._id,
            undefined,
            signal
        );

        const articles = (entertainmentResponse.data || []) as RawArticle[];

        const filterBySubcategory = (items: RawArticle[], subcategory: string) =>
            items.filter((article) =>
                Array.isArray(article.subcategories) &&
                article.subcategories.some(
                    (sub) =>
                        typeof sub?.value === 'string' &&
                        sub.value.toLowerCase() === subcategory
                )
            );

        const mapArticles = (items: RawArticle[]) => items.map((article) => mapArticleToPost(article));

        return {
            entertainmentArticles: mapArticles(articles),
            moviesAndShows: mapArticles(filterBySubcategory(articles, 'movies and shows')),
            music: mapArticles(filterBySubcategory(articles, 'music')),
            books: mapArticles(filterBySubcategory(articles, 'books')),
            comics: mapArticles(filterBySubcategory(articles, 'comics')),
        };
    }, []);

    const {
        data: {
            entertainmentArticles,
            moviesAndShows,
            music,
            books,
            comics,
        },
        isLoading,
        error,
    } = useAsyncData<EntertainmentArticlesData>(loadEntertainmentArticles, {
        initialData: emptyEntertainmentData,
        errorMessage: 'Unable to load articles. Please try again later.',
    });

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
                {entertainmentArticles.slice(0, 4).length > 0 && (
                    <Carousel posts={entertainmentArticles.slice(0, 4)} width='70%'/>
                )}
                </div>
            </div>
            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Movies and Shows</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-2 sm:col-span-2'>
                {moviesAndShows[4] && <ArticleBlock post={moviesAndShows[4]} height='400px'/>}
                </div>

                <div className='grid gap-4 grid-cols-2 lg:col-span-2'>
                {moviesAndShows.slice(5, 9).map((article) => (
                    <ArticleBlock key={article.id} post={article} height='190px' />
                ))}
                </div>
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Music</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                {music.slice(0, 4).map((article) => (
                <ArticleBlock key={article.id} post={article} height='230px' />
                ))}
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Books</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                {(() => {
                const posts = books.slice(0, 2);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
                {(() => {
                const posts = books.slice(2, 4);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Comics</h4>
            <div className='flex gap-4 overflow-x-auto'>
                {comics.slice(0, 3).map((article) => (
                <Comic key={article.id} post={article} height='190px' />
                ))}
            </div>
            </div>

            <div className='flex flex-col gap-4'>
            <iframe
                className="rounded-md w-full h-[550px]"
                src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            />
            {(() => {
                const posts = [entertainmentArticles[6], entertainmentArticles[7], entertainmentArticles[16], entertainmentArticles[22]]
                .filter(Boolean) as Post[];
                return posts.length ? <SideArticle posts={posts} width='28%'/> : null;
            })()}
            </div>
        </div>
        </>
    )
}

export default Entertainment;
