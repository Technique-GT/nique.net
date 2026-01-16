import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
import SideArticle from '../components/SideArticle';
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
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
            <div className='max-w-[95%] lg:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div>
                    <div className='flex flex-col gap-4 h-[80vh]'>
                        {recentLifeArticles[0] && <JustInBlock post={recentLifeArticles[0]} />}
                        {recentLifeArticles[1] && <FeaturedStory post={recentLifeArticles[1]} />}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Events</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {events[0] && <ArticleBlock post={events[0]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {events[1] && <ArticleBlock post={events[1]} height='222px' />}
                            {events[2] && <ArticleBlock post={events[2]} height='222px' />}
                            <div className='col-span-2'>
                                {events[3] && <ArticleBlock post={events[3]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const posts = events.slice(6, 8);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const posts = events.slice(8, 10);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">RSOs</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {rsos.slice(0, 4).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const posts = rsos.slice(4, 8);
                                return posts.length ? <SideArticle posts={posts} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Features</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {featuresArticles.slice(0, 6).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <InfiniteScrollModule categoryId={lifeCategoryId ?? undefined} />
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    {(() => {
                        const posts = lifeArticles.slice(0, 4);
                        return posts.length ? (
                            <SideArticle posts={posts} width='80px' hasDesc={true}/>
                        ) : null;
                    })()}
                    {/* <VerticalAd ad={MockAd} /> */}
                </div>
            </div>
        </>
    )
}

export default Life
