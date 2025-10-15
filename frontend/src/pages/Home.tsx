<<<<<<< Updated upstream
import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
=======
import { useCallback, useMemo } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
>>>>>>> Stashed changes
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
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
interface HomeArticlesData {
    recent: Post[];
    life: Post[];
    news: Post[];
    entertainment: Post[];
    opinion: Post[];
    sports: Post[];
}

const emptyHomeArticles: HomeArticlesData = {
    recent: [],
    life: [],
    news: [],
    entertainment: [],
    opinion: [],
    sports: [],
};

function Home() {
    const loadHomeArticles = useCallback(async (signal: AbortSignal): Promise<HomeArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];

        const findCategoryId = (name: string) => {
            const match = categories.find((category) => category.name?.toLowerCase() === name.toLowerCase());
            return match?._id || null;
        };

        const lifeCategoryId = findCategoryId(Categories.LIFE);
        const newsCategoryId = findCategoryId(Categories.NEWS);
        const entertainmentCategoryId = findCategoryId(Categories.ENTERTAINMENT);
        const opinionCategoryId = findCategoryId(Categories.OPINION);
        const sportsCategoryId = findCategoryId(Categories.SPORTS);

        const [
            recentResponse,
            lifeResponse,
            newsResponse,
            entertainmentResponse,
            opinionResponse,
            sportsResponse,
        ] = await Promise.all([
            articleService.fetchRecentArticles(5, 'published', signal),
            lifeCategoryId
                ? articleService.fetchArticlesByCategory(lifeCategoryId, 3, signal)
                : Promise.resolve<{ data: RawArticle[] }>({ data: [] }),
            newsCategoryId
                ? articleService.fetchArticlesByCategory(newsCategoryId, 3, signal)
                : Promise.resolve<{ data: RawArticle[] }>({ data: [] }),
            entertainmentCategoryId
                ? articleService.fetchArticlesByCategory(entertainmentCategoryId, 8, signal)
                : Promise.resolve<{ data: RawArticle[] }>({ data: [] }),
            opinionCategoryId
                ? articleService.fetchArticlesByCategory(opinionCategoryId, 5, signal)
                : Promise.resolve<{ data: RawArticle[] }>({ data: [] }),
            sportsCategoryId
                ? articleService.fetchArticlesByCategory(sportsCategoryId, 5, signal)
                : Promise.resolve<{ data: RawArticle[] }>({ data: [] }),
        ]);

        const recentArticles = (recentResponse.data || []) as RawArticle[];
        const lifeArticles = (lifeResponse.data || []) as RawArticle[];
        const newsArticles = (newsResponse.data || []) as RawArticle[];
        const entertainmentArticles = (entertainmentResponse.data || []) as RawArticle[];
        const opinionArticles = (opinionResponse.data || []) as RawArticle[];
        const sportsArticles = (sportsResponse.data || []) as RawArticle[];

        const mapArticles = (articles: RawArticle[]) => articles.map((article) => mapArticleToPost(article));

        return {
            recent: mapArticles(recentArticles),
            life: mapArticles(lifeArticles),
            news: mapArticles(newsArticles),
            entertainment: mapArticles(entertainmentArticles),
            opinion: mapArticles(opinionArticles),
            sports: mapArticles(sportsArticles),
        };
    }, []);

    const {
        data: {
            recent: recentArticles,
            life: lifeArticles,
            news: newsArticles,
            entertainment: entertainmentArticles,
            opinion: opinionArticles,
            sports: sportsArticles,
        },
        isLoading,
        error,
    } = useAsyncData<HomeArticlesData>(loadHomeArticles, {
        initialData: emptyHomeArticles,
        errorMessage: 'Unable to load articles. Please try again later.',
    });

    const sideArticles = useMemo(() => { 
        return opinionArticles.slice(0, 3);
    }, [opinionArticles]);
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
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] w-full'>
                        <div className='flex flex-col gap-4 order-last lg:order-first'>
<<<<<<< Updated upstream
                            <ArticleBlock post={post[3]} height='200px' />
                            <ArticleBlock post={post[4]} height='200px' />
                            <ArticleBlock post={post[5]} height='200px' />
                            <ArticleBlock post={post[9]} height='200px' />
=======
                            {recentArticles.slice(2, 6).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='200px' />
                            ))}
>>>>>>> Stashed changes
                        </div>
                        <div className='flex flex-col gap-4'>
                            <JustInBlock post={post[0]} />
                            <FeaturedStory post={post[12]} height='695px' />
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.LIFE}</h4>
                    <div className='grid grid-cols-1 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            <ArticleBlock post={post[8]} height='396px' />
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            <ArticleBlock post={post[10]} height='190px' />
                            <ArticleBlock post={post[11]} height='190px' />
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.NEWS}</h4>
                    <div className='flex flex-col sm:flex-row gap-4'>
                        <ArticleBlock post={post[13]} height='200px' />
                        <ArticleBlock post={post[14]} height='200px' />
                        <ArticleBlock post={post[15]} height='200px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <ArticleBlock post={post[16]} height='230px' />
                        <ArticleBlock post={post[17]} height='230px' />
                        <ArticleBlock post={post[18]} height='230px' />
                        <ArticleBlock post={post[19]} height='230px' />
                        <ArticleBlock post={post[20]} height='230px' />
                        <ArticleBlock post={post[21]} height='230px' />
                        <ArticleBlock post={post[22]} height='230px' />
                        <ArticleBlock post={post[23]} height='230px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.SPORTS}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {sportsArticles.map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle posts={[post[6], post[7], post[16]]}/>
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Home
