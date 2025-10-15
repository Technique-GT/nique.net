<<<<<<< Updated upstream
import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
=======
import { useCallback } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
>>>>>>> Stashed changes
import FeaturedStory from '../components/FeaturedStory';
import MockAd from '../assets/mock_advertisement.jpg';
import JustInBlock from '../components/JustIn';
import SideArticle from '../components/SideArticle';
import SmallArticle from '../components/SmallArticle';
import VerticalAd from '../components/VerticalAd';
import { Categories } from '../types/categories';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

<<<<<<< Updated upstream
function Home() {
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
    
>>>>>>> Stashed changes
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner/>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className='max-w-[1470px] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div className='w-full'>
                    <div className='flex flex-col gap-4'>
                        <JustInBlock post={post[0]} />
                        <FeaturedStory post={post[12]} height='695px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Atlanta News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
<<<<<<< Updated upstream
                            <ArticleBlock post={post[9]} height='460px' />
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            <ArticleBlock post={post[10]} height='222px' />
                            <ArticleBlock post={post[11]} height='222px' />
                            <div className='col-span-2'>
                                <ArticleBlock post={post[9]} height='222px' />
                            </div>
                        </div>
                        <div className='col-span-2'>
                            
                            <SmallArticle posts={[post[12], post[13]]} direction='left'/>
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            <SmallArticle posts={[post[14], post[15]]} direction='left'/>
=======
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
>>>>>>> Stashed changes
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
<<<<<<< Updated upstream
                            <ArticleBlock post={post[1]} height='222px' />
                            <ArticleBlock post={post[2]} height='222px' />
                            <ArticleBlock post={post[3]} height='222px' />
                            <ArticleBlock post={post[4]} height='222px' />
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            <SideArticle posts={[post[5], post[6], post[7], post[8]]} width='18%'/>
=======
                            {usNews.slice(0, 4).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const posts = usNews.slice(14, 18);
                                return posts.length ? <SideArticle posts={posts} width='18%'/> : null;
                            })()}
>>>>>>> Stashed changes
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
<<<<<<< Updated upstream
                        <ArticleBlock post={post[16]} height='230px' />
                        <ArticleBlock post={post[17]} height='230px' />
                        <ArticleBlock post={post[18]} height='230px' />
                        <ArticleBlock post={post[19]} height='230px' />
                        <ArticleBlock post={post[20]} height='230px' />
                        <ArticleBlock post={post[21]} height='230px' />
=======
                        {entertainmentNews.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
>>>>>>> Stashed changes
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    <SideArticle posts={[post[6], post[7], post[16]]} width='80px' hasDesc = { true }/>
                    <VerticalAd ad={MockAd} />
                </div>
            </div>
        </>
    )
}

export default Home
