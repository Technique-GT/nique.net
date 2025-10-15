import { useEffect, useState } from 'react';
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

const mapArticleToPost = (article: any): Post => {
    const primaryAuthor = article.authors?.[0]?.user;

    let authorName = 'Technique Staff';
    if (primaryAuthor) {
        if (typeof primaryAuthor === 'string') {
        authorName = primaryAuthor;
        } else {
        const firstAndLast = [primaryAuthor.firstName, primaryAuthor.lastName]
            .filter(Boolean)
            .join(' ');

        authorName =
            primaryAuthor.username ||
            firstAndLast ||
            primaryAuthor.email ||
            authorName;
        }
    }

    const descriptionSource = article.content || '';
    const normalizedDescription =
        typeof descriptionSource === 'string'
        ? descriptionSource.replace(/<[^>]*>/g, '').slice(0, 220) + '...'
        : '';

    return {
        id: article._id || '',
        title: article.title || '',
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        authors: article.authors || [],
        categories: article.categories || [],
        tags: article.tags || [],
        featuredImage: article.featuredImage,
        status: article.status,
        isSticky: article.isSticky,
        allowComments: article.allowComments,
        viewCount: article.viewCount,
        publishedAt: article.publishedAt,
        updatedBy: article.updatedBy,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        desc: normalizedDescription,
        author: authorName,
        category: article.categories?.[0]?.name || '',
    };
};

function News() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [newsArticles, setNewsArticles] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);

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

                if (!newsCategory?._id) {
                    if (!isMounted) return;
                    setNewsArticles([]);
                    setError('News category not found.');
                    return;
                }

                const newsResponse = await articleService.fetchArticlesByCategory(
                    newsCategory._id,
                    undefined,
                    controller.signal
                );

                if (!isMounted) {
                    return;
                }

                setNewsArticles((newsResponse.data || []).map(mapArticleToPost));
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
                            {newsArticles[2] && <ArticleBlock post={newsArticles[2]} height='460px' />}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {newsArticles[3] && <ArticleBlock post={newsArticles[3]} height='222px' />}
                            {newsArticles[4] && <ArticleBlock post={newsArticles[4]} height='222px' />}
                            <div className='col-span-2'>
                                {newsArticles[5] && <ArticleBlock post={newsArticles[5]} height='222px' />}
                            </div>
                        </div>
                        <div className='col-span-2'>
                            {(() => {
                                const posts = newsArticles.slice(6, 8);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                        <hr className="block lg:hidden col-span-2" />
                        <div className='col-span-2'>
                            {(() => {
                                const posts = newsArticles.slice(8, 10);
                                return posts.length ? <SmallArticle posts={posts} direction='left'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            {newsArticles.slice(10, 14).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='222px' />
                            ))}
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            {(() => {
                                const posts = newsArticles.slice(14, 18);
                                return posts.length ? <SideArticle posts={posts} width='18%'/> : null;
                            })()}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        {newsArticles.slice(18, 24).map((article) => (
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
