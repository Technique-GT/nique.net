<<<<<<< Updated upstream
import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
=======
import { useCallback } from 'react'
import articleService from '../services/articleService';
import { Categories } from '../types/categories';
>>>>>>> Stashed changes
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
import VerticalAd from "../components/VerticalAd";
import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import InstagramEmbed from '../components/InstaEmbed';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

<<<<<<< Updated upstream
function Sports() {
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
interface SportsArticlesData {
    sportsArticles: Post[];
    techSports: Post[];
    usSports: Post[];
    seasonScoreboard: Post[];
}

const emptySportsData: SportsArticlesData = {
    sportsArticles: [],
    techSports: [],
    usSports: [],
    seasonScoreboard: [],
};

function Sports() {
    const loadSportsArticles = useCallback(async (signal: AbortSignal): Promise<SportsArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];
        const sportsCategory = categories.find((category) =>
            category.name?.toLowerCase() === Categories.SPORTS.toLowerCase()
        );

        if (!sportsCategory?._id) {
            throw new Error('Sports category not found.');
        }

        const sportsResponse = await articleService.fetchArticlesByCategory(
            sportsCategory._id,
            undefined,
            signal
        );

        const articles = (sportsResponse.data || []) as RawArticle[];

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
            sportsArticles: mapArticles(articles),
            techSports: mapArticles(filterBySubcategory(articles, 'tech sports')),
            usSports: mapArticles(filterBySubcategory(articles, 'us sports')),
            seasonScoreboard: mapArticles(filterBySubcategory(articles, 'season scoreboard')),
        };
    }, []);

    const {
        data: {
            sportsArticles,
            techSports,
            usSports,
            seasonScoreboard,
        },
        isLoading,
        error,
    } = useAsyncData<SportsArticlesData>(loadSportsArticles, {
        initialData: emptySportsData,
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
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[auto_35%] w-full'>
                        <div className='flex flex-col gap-4'>
                            <ArticleBlock post={post[1]} height='768px' />
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1'>
                            <ArticleBlock post={post[2]} height='180px' />
                            <ArticleBlock post={post[3]} height='180px' />
                            <ArticleBlock post={post[4]} height='180px' />
                            <ArticleBlock post={post[5]} height='180px' />
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Tech Sports</h4>
                    <div className='grid grid-cols-1 lg:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
<<<<<<< Updated upstream
                            <SmallArticle posts={[post[6], post[7], post[8], post[9]]} direction="left"/>
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                            <ArticleBlock post={post[10]} height='190px' />
                            <ArticleBlock post={post[11]} height='190px' />
                            <ArticleBlock post={post[12]} height='190px' />
                            <ArticleBlock post={post[13]} height='190px' />
=======
                            {(() => {
                                const posts = techSports.slice(0, 4);
                                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                            })()}
                        </div>
                        <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                            {techSports.slice(4, 8).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='190px' />
                            ))}
>>>>>>> Stashed changes
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. Sports</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
<<<<<<< Updated upstream
                        <ArticleBlock post={post[14]} height='180px' />
                        <ArticleBlock post={post[15]} height='180px' />
                        <ArticleBlock post={post[16]} height='180px' />
                        <ArticleBlock post={post[17]} height='180px' />
                        <ArticleBlock post={post[18]} height='180px' />
                        <ArticleBlock post={post[19]} height='180px' />
=======
                        {usSports.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='180px' />
                        ))}
>>>>>>> Stashed changes
                    </div>
                </div>

                <div className='flex flex-col'>
                    <InstagramEmbed username="gtathletics" />
                    <hr className='my-3 border-nique-blue' />
                    <VerticalAd ad={MockAd} />
                    <hr className='my-3 border-nique-blue' />
                    <h4 className="text-nique-blue font-bold mb-4 text-2xl">Season Scoreboard</h4>
<<<<<<< Updated upstream
                    <SideArticle posts={[post[20], post[21], post[22], post[23], post[24]]} />
=======
                    {(() => {
                        const posts = seasonScoreboard.slice(0, 5);
                        return posts.length ? <SideArticle posts={posts} /> : null;
                    })()}
>>>>>>> Stashed changes
                </div>
            </div>
        </>
    )
}

export default Sports
