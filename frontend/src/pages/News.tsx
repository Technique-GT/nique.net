import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import { Categories } from '../types/categories';
import FeaturedStory from '../components/FeaturedStory';
// import MockAd from '../assets/mock_advertisement.jpg';
import JustInBlock from '../components/JustIn';
import SideArticle from '../components/SideArticle';
import SmallArticle from '../components/SmallArticle';
// import VerticalAd from '../components/VerticalAd';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { mapArticleToPost } from '../utils/articleMapping';

function News() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentNews, setRecentNews] = useState<Post[]>([]);
    const [newsArticles, setNewsArticles] = useState<Post[]>([]);
    const [theInstituteNews, setTheInstituteNews] = useState<Post[]>([]);
    const [cityStateNews, setCityStateNews] = useState<Post[]>([]);
    const [scienceResearchNews, setScienceResearchNews] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newsCategoryId, setNewsCategoryId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
                const categories = categoriesResponse.data || [];

                const newsCategory = categories.find((category: any) =>
                    category.name?.toLowerCase() === Categories.NEWS.toLowerCase()
                );
                const categoryId = typeof newsCategory?._id === 'string' ? newsCategory._id : null;
                setNewsCategoryId(categoryId);

                if (!categoryId) {
                    if (!isMounted) return;
                    setNewsArticles([]);
                    setError('News category not found.');
                    return;
                }

                const newsResponse = await articleService.fetchArticles(
                    { category: categoryId, status: 'published' },
                    controller.signal
                );

                const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
                const allNewsArticles = mapResponseData(newsResponse.data);
                const getTimestamp = (post: Post) => {
                    const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                    const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                    return Math.max(published, created);
                };
                const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

                const stickyPosts = allNewsArticles.filter((post) => post.isSticky).sort(sortByPublishedDesc);
                const nonStickyPosts = allNewsArticles.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
                const orderedNews = [...stickyPosts, ...nonStickyPosts];
                const RECENT_COUNT = Math.max(2, stickyPosts.length);
                const recentSelection = orderedNews.slice(0, RECENT_COUNT);
                const remainingNews = orderedNews.slice(RECENT_COUNT);
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

                setRecentNews(recentSelection);
                setNewsArticles(remainingNews);
                setTheInstituteNews(filterBySubcategory(newsResponse.data || [], 'the institute'));
                setCityStateNews(filterBySubcategory(newsResponse.data || [], 'city & state'));
                setScienceResearchNews(filterBySubcategory(newsResponse.data || [], 'science & research'));
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
                        {recentNews[0] && <JustInBlock post={recentNews[0]} />}
                        {recentNews[1] && <FeaturedStory post={recentNews[1]} />}
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">The Institute</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            {theInstituteNews[0] && <ArticleBlock post={theInstituteNews[0]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {theInstituteNews[1] && <ArticleBlock post={theInstituteNews[1]} height='222px' />}
                            {theInstituteNews[2] && <ArticleBlock post={theInstituteNews[2]} height='222px' />}
                            <div className='col-span-2'>
                                {theInstituteNews[3] && <ArticleBlock post={theInstituteNews[3]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const posts = theInstituteNews.slice(6, 8);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const posts = theInstituteNews.slice(8, 10);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">City & State</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {cityStateNews.slice(0, 4).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const posts = cityStateNews.slice(4, 8);
                                return posts.length ? <SideArticle posts={posts} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-3' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Science & Research</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {scienceResearchNews.slice(0, 6).map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>

                    <InfiniteScrollModule categoryId={newsCategoryId ?? undefined} />
                </div>

                <div className='flex flex-col gap-4'>
                    <hr className="lg:mt-15" />
                    {(() => {
                        const posts = newsArticles.slice(0, 4);
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

export default News
