import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
// import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import Navbar from '../components/Navbar';
// import VerticalAd from '../components/VerticalAd';
import InstaEmbed from '../components/InstaEmbed';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { mapArticleToPost } from '../utils/articleMapping';

function Life() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentLifeArticles, setRecentLifeArticles] = useState<Post[]>([]);
    const [lifeArticles, setLifeArticles] = useState<Post[]>([]);
    const [events, setEvents] = useState<Post[]>([]);
    const [rsos, setRsos] = useState<Post[]>([]);
    const [featuresArticles, setFeaturesArticles] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lifeCategoryId, setLifeCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
                const categories = categoriesResponse.data || [];

                const lifeCategory = categories.find((category: any) =>
                    category.name?.toLowerCase() === Categories.LIFE.toLowerCase()
                );
                const categoryId = typeof lifeCategory?._id === 'string' ? lifeCategory._id : null;
                setLifeCategoryId(categoryId);

                if (!lifeCategory?._id) {
                    if (!isMounted) return;
                    setLifeArticles([]);
                    setError('Life category not found.');
                    return;
                }

                const lifeResponse = await articleService.fetchArticles(
                    { category: lifeCategory._id, status: 'published' },
                    controller.signal
                );

                const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
                const allLifeArticles = mapResponseData(lifeResponse.data);
                const getTimestamp = (post: Post) => {
                    const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                    const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                    return Math.max(published, created);
                };
                const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

                const stickyPosts = allLifeArticles.filter((post) => post.isSticky).sort(sortByPublishedDesc);
                const nonStickyPosts = allLifeArticles.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
                const orderedLife = [...stickyPosts, ...nonStickyPosts];
                const RECENT_COUNT = Math.max(7, stickyPosts.length);
                const recentSelection = orderedLife.slice(0, RECENT_COUNT);
                const remainingLife = orderedLife.slice(RECENT_COUNT);
                const recentIds = new Set(recentSelection.map((post) => post.id));

                const filterBySubcategory = (articles: any[], subcategory: string) =>
                    articles
                        .filter((article: any) =>
                            Array.isArray(article.subcategories) &&
                            article.subcategories.some(
                                (sub: any) =>
                                    typeof sub?.value === 'string' &&
                                    sub.value.toLowerCase() === subcategory
                            )
                        )
                        .map(mapArticleToPost)
                        .filter((post) => !recentIds.has(post.id))
                        .sort(sortByPublishedDesc);

                if (!isMounted) {
                    return;
                }

                setRecentLifeArticles(recentSelection);
                setLifeArticles(remainingLife);
                setEvents(filterBySubcategory(lifeResponse.data || [], 'campus events'));
                setRsos(filterBySubcategory(lifeResponse.data || [], 'rsos'));
                setFeaturesArticles(filterBySubcategory(lifeResponse.data || [], 'features'));
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
                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Most Recent</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {recentLifeArticles[0] && <ArticleBlock post={recentLifeArticles[0]} height='460px' />}
                        </div>
                        <div className='col-span-2 lg:col-span-1'>
                            {recentLifeArticles[1] && <ArticleBlock post={recentLifeArticles[1]} height='460px' />}
                        </div>
                        <div className='grid gap-4 grid-rows-2 col-span-2 lg:col-span-1'>
                            {recentLifeArticles[2] && <ArticleBlock post={recentLifeArticles[2]} height='222px' />}
                            {recentLifeArticles[3] && <ArticleBlock post={recentLifeArticles[3]} height='222px' />}
                        </div>
                        <div className='col-span-2 lg:col-span-4 m-0'>
                            {recentLifeArticles.slice(4, 7).length > 0 && (
                                <Carousel posts={recentLifeArticles.slice(4, 7)} width='80%'/>
                            )}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Campus Events</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {events.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">RSOs</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {rsos.slice(0, 4).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">More Stories</h4>
                    <div className='grid gap-4 grid-cols-1 lg:grid-rows-3 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='row-span-2 col-span-2'>
                            {(() => {
                                const posts = lifeArticles.slice(0, 4)
                                    .filter(Boolean) as Post[];
                                return posts.length ? <SideArticle posts={posts} width='18%' /> : null;
                            })()}
                        </div>
                        <div className='grid row-span-2 col-span-2 gap-4 lg:gap-y-0'>
                            <div className='col-span-2'>
                                {lifeArticles[4] && <ArticleBlock post={lifeArticles[4]} height='280px' />}
                            </div>
                            {lifeArticles[5] && <ArticleBlock post={lifeArticles[5]} height='280px' />}
                            {lifeArticles[6] && <ArticleBlock post={lifeArticles[6]} height='280px' />}
                        </div>
                        <div className='col-span-2'>
                            {lifeArticles[7] && <ArticleBlock post={lifeArticles[7]} height='230px' />}
                        </div>
                        {lifeArticles[8] && <ArticleBlock post={lifeArticles[8]} height='230px' />}
                        {lifeArticles[9] && <ArticleBlock post={lifeArticles[9]} height='230px' />}
                    </div>

                    <InfiniteScrollModule categoryId={lifeCategoryId ?? undefined} />

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

                    <InstaEmbed username='gt_nique' />

                    <hr />

                    {/* <VerticalAd ad={MockAd} />

                    <hr /> */}

                    <h4 className="font-bold text-2xl text-nique-blue">Features</h4>   
                    
                    <hr />

                    {(() => {
                        const posts = featuresArticles.slice(0, 4)
                            .filter(Boolean) as Post[];
                        return posts.length ? <SideArticle posts={posts} width='80px'/> : null;
                    })()}
                </div>
            </div>
        </>
    )
}

export default Life
