import { useCallback } from 'react';
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
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

interface NewsArticlesData {
    news: Post[];
    atlantaNews: Post[];
    usNews: Post[];
    entertainmentNews: Post[];
}

const emptyNewsArticles: NewsArticlesData = {
    news: [],
    atlantaNews: [],
    usNews: [],
    entertainmentNews: [],
};

function News() {
    const loadNewsArticles = useCallback(async (signal: AbortSignal): Promise<NewsArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];

        const newsCategory = categories.find((category) =>
            category.name?.toLowerCase() === Categories.NEWS.toLowerCase()
        );

        if (!newsCategory?._id) {
            throw new Error('News category not found.');
        }

        const newsResponse = await articleService.fetchArticlesByCategory(
            newsCategory._id,
            undefined,
            signal
        );

        const filterBySubcategory = (articles: RawArticle[], subcategory: string) =>
            articles.filter((article) =>
                Array.isArray(article.subcategories) &&
                article.subcategories.some(
                    (sub) =>
                        typeof sub?.value === 'string' &&
                        sub.value.toLowerCase() === subcategory
                )
            );

        const allNewsArticles = (newsResponse.data || []) as RawArticle[];

        const mapWithEllipsis = (items: RawArticle[]) =>
            items.map((article) =>
                mapArticleToPost(article, {
                    descriptionFields: ['content'],
                    appendEllipsis: true,
                })
            );

        return {
            news: mapWithEllipsis(allNewsArticles),
            atlantaNews: mapWithEllipsis(filterBySubcategory(allNewsArticles, 'atlanta news')),
            usNews: mapWithEllipsis(filterBySubcategory(allNewsArticles, 'us news')),
            entertainmentNews: mapWithEllipsis(filterBySubcategory(allNewsArticles, 'entertainment')),
        };
    }, []);

    const {
        data: {
            news: newsArticles,
            atlantaNews,
            usNews,
            entertainmentNews,
        },
        isLoading,
        error,
    } = useAsyncData<NewsArticlesData>(loadNewsArticles, {
        initialData: emptyNewsArticles,
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
                    <div className='flex flex-col gap-4'>
                        {newsArticles[0] && <JustInBlock post={newsArticles[0]} />}
                        {newsArticles[1] && <FeaturedStory post={newsArticles[1]} height='695px' />}
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

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {entertainmentNews.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    {(() => {
                        const posts = newsArticles.slice(6, 9);
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
