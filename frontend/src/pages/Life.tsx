<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
import MockAPI from '../services/MockAPI';
=======
import { useCallback } from 'react';
import articleService from '../services/articleService';
>>>>>>> Stashed changes
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import Navbar from '../components/Navbar';
import VerticalAd from '../components/VerticalAd';
import InstaEmbed from '../components/InstaEmbed';
import Spinner from '../components/Spinner';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

<<<<<<< Updated upstream
function Life() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [post, setPost] = useState<Post[]>([]);

    useEffect(() => {
        getPost();
    }, [])

    const getPost = () => {
        MockAPI.getPost.then(resp => {
            const result = resp.data.slice(0, 25).map((item: any) => ({
                id: item.id,
                title: item.title,
                desc: item.summary,
                author: item.user.first_name + " " + item.user.last_name,
                category: item.category,
                coverImage: item.featured_image
            }));
            setPost(result);
            setIsLoading(false);
        })
    }

=======
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
    
>>>>>>> Stashed changes
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
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
                            <ArticleBlock post={post[0]} height='460px' />
                        </div>
                        <div className='col-span-2 lg:col-span-1'>
                        <ArticleBlock post={post[1]} height='460px' />
                        </div>
                        <div className='grid gap-4 grid-rows-2 col-span-2 lg:col-span-1'>
                            <ArticleBlock post={post[2]} height='222px' />
                            <ArticleBlock post={post[3]} height='222px' />
                        </div>
                        <div className='col-span-2 lg:col-span-4 m-0'>
                            <Carousel posts={[post[1], post[2], post[3], post[4]]} width='80%'/>
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Tech Fashion</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
<<<<<<< Updated upstream
                        <ArticleBlock post={post[4]} height='230px' />
                        <ArticleBlock post={post[5]} height='230px' />
                        <ArticleBlock post={post[6]} height='230px' />
                        <ArticleBlock post={post[7]} height='230px' />
=======
                        {techFashion.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
>>>>>>> Stashed changes
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">More Stories</h4>
                    <div className='grid gap-4 grid-cols-1 lg:grid-rows-3 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='row-span-2 col-span-2'>
                            <SideArticle posts={[post[6], post[7], post[8], post[16]]} width='18%' />
                        </div>
                        <div className='grid row-span-2 col-span-2 gap-4 lg:gap-y-0'>
                            <div className='col-span-2'>
                                <ArticleBlock post={post[9]} height='222px' />
                            </div>
                            <ArticleBlock post={post[10]} height='222px' />
                            <ArticleBlock post={post[11]} height='222px' />
                        </div>
                        <div className='col-span-2'>
                            <ArticleBlock post={post[12]} height='230px' />
                        </div>
                        <ArticleBlock post={post[13]} height='230px' />
                        <ArticleBlock post={post[14]} height='230px' />
                    </div>

                </div>

                <div className='flex flex-col gap-4'>
                    <h4 className="font-bold text-2xl">Buzz Around Campus</h4>

                    <hr />

                    <h4 className="font-bold text-2xl text-nique-blue">What are you most excited for this Homecoming?</h4> 
                    <SideArticle posts={[post[0], post[1], post[2] ]} width='80px' hasBreak={false} />
                
                    <hr />

                    <InstaEmbed username='gtathletics' />

                    <hr />

                    <VerticalAd ad={MockAd} />

                    <hr />

                    <h4 className="font-bold text-2xl text-nique-blue">Alumni Spotlight</h4>   
                    
                    <hr />

                    <SideArticle posts={[post[6], post[7], post[16], post[17], post[18]]} width='80px'/>
                </div>
            </div>
        </>
    )
}

export default Life
