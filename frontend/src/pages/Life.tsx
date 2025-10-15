import { useCallback } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import Navbar from '../components/Navbar';
import VerticalAd from '../components/VerticalAd';
import InstaEmbed from '../components/InstaEmbed';
import Spinner from '../components/Spinner';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

interface LifeArticlesData {
    lifeArticles: Post[];
    techFashion: Post[];
}

const emptyLifeData: LifeArticlesData = {
    lifeArticles: [],
    techFashion: [],
};

function Life() {
    const loadLifeArticles = useCallback(async (signal: AbortSignal): Promise<LifeArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];

        const lifeCategory = categories.find((category) =>
            category.name?.toLowerCase() === Categories.LIFE.toLowerCase()
        );

        if (!lifeCategory?._id) {
            throw new Error('Life category not found.');
        }

        const lifeResponse = await articleService.fetchArticlesByCategory(
            lifeCategory._id,
            undefined,
            signal
        );

        const articles = (lifeResponse.data || []) as RawArticle[];

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
            lifeArticles: mapArticles(articles),
            techFashion: mapArticles(filterBySubcategory(articles, 'tech fashion')),
        };
    }, []);

    const {
        data: {
            lifeArticles,
            techFashion,
        },
        isLoading,
        error,
    } = useAsyncData<LifeArticlesData>(loadLifeArticles, {
        initialData: emptyLifeData,
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
                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Most Recent</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {lifeArticles[0] && <ArticleBlock post={lifeArticles[0]} height='460px' />}
                        </div>
                        <div className='col-span-2 lg:col-span-1'>
                            {lifeArticles[1] && <ArticleBlock post={lifeArticles[1]} height='460px' />}
                        </div>
                        <div className='grid gap-4 grid-rows-2 col-span-2 lg:col-span-1'>
                            {lifeArticles[2] && <ArticleBlock post={lifeArticles[2]} height='222px' />}
                            {lifeArticles[3] && <ArticleBlock post={lifeArticles[3]} height='222px' />}
                        </div>
                        <div className='col-span-2 lg:col-span-4 m-0'>
                            {lifeArticles.slice(1, 5).length > 0 && (
                                <Carousel posts={lifeArticles.slice(1, 5)} width='80%'/>
                            )}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Tech Fashion</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {techFashion.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">More Stories</h4>
                    <div className='grid gap-4 grid-cols-1 lg:grid-rows-3 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='row-span-2 col-span-2'>
                            {(() => {
                                const posts = [lifeArticles[6], lifeArticles[7], lifeArticles[8], lifeArticles[9]]
                                    .filter(Boolean) as Post[];
                                return posts.length ? <SideArticle posts={posts} width='18%' /> : null;
                            })()}
                        </div>
                        <div className='grid row-span-2 col-span-2 gap-4 lg:gap-y-0'>
                            <div className='col-span-2'>
                                {lifeArticles[9] && <ArticleBlock post={lifeArticles[9]} height='222px' />}
                            </div>
                            {lifeArticles[10] && <ArticleBlock post={lifeArticles[10]} height='222px' />}
                            {lifeArticles[11] && <ArticleBlock post={lifeArticles[11]} height='222px' />}
                        </div>
                        <div className='col-span-2'>
                            {lifeArticles[12] && <ArticleBlock post={lifeArticles[12]} height='230px' />}
                        </div>
                        {lifeArticles[13] && <ArticleBlock post={lifeArticles[13]} height='230px' />}
                        {lifeArticles[14] && <ArticleBlock post={lifeArticles[14]} height='230px' />}
                    </div>

                </div>

                {/* Sidebar */}
                <div className='flex flex-col gap-4'>
                    <h4 className="font-bold text-2xl">Buzz Around Campus</h4>

                    <hr />

                    <h4 className="font-bold text-2xl text-nique-blue">What are you most excited for this Homecoming?</h4> 
                    {(() => {
                        const posts = [lifeArticles[0], lifeArticles[1], lifeArticles[2]].filter(Boolean) as Post[];
                        return posts.length ? (
                            <SideArticle posts={posts} width='80px' hasBreak={false} />
                        ) : null;
                    })()}
                
                    <hr />

                    <InstaEmbed username='gtathletics' />

                    <hr />

                    <VerticalAd ad={MockAd} />

                    <hr />

                    <h4 className="font-bold text-2xl text-nique-blue">Alumni Spotlight</h4>   
                    
                    <hr />

                    {(() => {
                        const posts = [lifeArticles[14], lifeArticles[15], lifeArticles[16], lifeArticles[17], lifeArticles[18]]
                            .filter(Boolean) as Post[];
                        return posts.length ? <SideArticle posts={posts} width='80px'/> : null;
                    })()}
                </div>
            </div>
        </>
    )
}

export default Life
