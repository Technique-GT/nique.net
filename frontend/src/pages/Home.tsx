import { useEffect, useMemo, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import { Categories } from '../types/categories';
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

    const descriptionSource = article.excerpt || article.content || '';
    const normalizedDescription =
        typeof descriptionSource === 'string'
        ? descriptionSource.replace(/<[^>]*>/g, '').slice(0, 220)
        : '';

    return {
        id: article._id,
        title: article.title,
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
        coverImage: article.featuredImage?.url || '',
    };
};

function Home() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentArticles, setRecentArticles] = useState<Post[]>([]);
    const [lifeArticles, setLifeArticles] = useState<Post[]>([]);
    const [newsArticles, setNewsArticles] = useState<Post[]>([]);
    const [entertainmentArticles, setEntertainmentArticles] = useState<Post[]>([]);
    const [opinionArticles, setOpinionArticles] = useState<Post[]>([]);
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

                const findCategoryId = (name: string) => {
                    const match = categories.find((category: any) => category.name?.toLowerCase() === name.toLowerCase());
                    return match?._id || null;
                };

                const lifeCategoryId = findCategoryId(Categories.LIFE);
                const newsCategoryId = findCategoryId(Categories.NEWS);
                const entertainmentCategoryId = findCategoryId(Categories.ENTERTAINMENT);
                const opinionCategoryId = findCategoryId(Categories.OPINION);

                const [
                    recentResponse,
                    lifeResponse,
                    newsResponse,
                    entertainmentResponse,
                    opinionResponse,
                ] = await Promise.all([
                    articleService.fetchRecentArticles(5, 'published', controller.signal),
                    lifeCategoryId
                        ? articleService.fetchArticlesByCategory(lifeCategoryId, 3, controller.signal)
                        : Promise.resolve({ data: [] }),
                    newsCategoryId
                        ? articleService.fetchArticlesByCategory(newsCategoryId, 3, controller.signal)
                        : Promise.resolve({ data: [] }),
                    entertainmentCategoryId
                        ? articleService.fetchArticlesByCategory(entertainmentCategoryId, 8, controller.signal)
                        : Promise.resolve({ data: [] }),
                    opinionCategoryId
                        ? articleService.fetchArticlesByCategory(opinionCategoryId, 5, controller.signal)
                        : Promise.resolve({ data: [] }),
                ]);

                if (!isMounted) {
                    return;
                }

                setRecentArticles((recentResponse.data || []).map(mapArticleToPost));
                setLifeArticles((lifeResponse.data || []).map(mapArticleToPost));
                setNewsArticles((newsResponse.data || []).map(mapArticleToPost));
                setEntertainmentArticles((entertainmentResponse.data || []).map(mapArticleToPost));
                setOpinionArticles((opinionResponse.data || []).map(mapArticleToPost));
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

    const sideArticles = useMemo(() => { 
        return opinionArticles.slice(0, 3);
    }, [opinionArticles]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner/>
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
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] w-full'>
                        <div className='flex flex-col gap-4 order-last lg:order-first'>
                            {recentArticles.slice(1, 5).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='200px' />
                            ))}
                        </div>
                        <div className='flex flex-col gap-4'>
                            {recentArticles[0] && <JustInBlock post={recentArticles[0]} />}
                            {recentArticles[1] && <FeaturedStory post={recentArticles[1]} height='695px' />}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.LIFE}</h4>
                    <div className='grid grid-cols-1 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            {lifeArticles[0] && <ArticleBlock post={lifeArticles[0]} height='396px' />}
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            {lifeArticles.slice(1).map((article) => (
                                <ArticleBlock key={article.id} post={article} height='190px' />
                            ))}
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.NEWS}</h4>
                    <div className='flex flex-col sm:flex-row gap-4'>
                        {newsArticles.map((article) => (
                            <ArticleBlock key={article.id} post={article} height='200px' />
                        ))}
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {entertainmentArticles.map((article) => (
                            <ArticleBlock key={article.id} post={article} height='230px' />
                        ))}
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle posts={sideArticles}/>
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Home
