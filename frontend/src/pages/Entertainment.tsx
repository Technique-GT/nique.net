import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import SmallArticle from '../components/SmallArticle';
import Comic from '../components/Comic';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { Categories } from '../types/categories';

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
        coverImage: article.featuredImage?.url || '',
    };
};

function Entertainment() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [entertainmentArticles, setEntertainmentArticles] = useState<Post[]>([]);
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

            const entertainmentCategory = categories.find((category: any) =>
            category.name?.toLowerCase() === Categories.ENTERTAINMENT.toLowerCase()
            );

            if (!entertainmentCategory?._id) {
            if (!isMounted) return;
            setEntertainmentArticles([]);
            setError('Entertainment category not found.');
            return;
            }

            const entertainmentResponse = await articleService.fetchArticlesByCategory(
            entertainmentCategory._id,
            undefined,
            controller.signal
            );

            if (!isMounted) {
            return;
            }

            setEntertainmentArticles((entertainmentResponse.data || []).map(mapArticleToPost));
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
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-4 m-0'>
                {entertainmentArticles.slice(0, 4).length > 0 && (
                    <Carousel posts={entertainmentArticles.slice(0, 4)} width='70%'/>
                )}
                </div>
            </div>
            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Movies and Shows</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='lg:col-span-2 sm:col-span-2'>
                {entertainmentArticles[4] && <ArticleBlock post={entertainmentArticles[4]} height='400px'/>}
                </div>

                <div className='grid gap-4 grid-cols-2 lg:col-span-2'>
                {entertainmentArticles.slice(5, 9).map((article) => (
                    <ArticleBlock key={article.id} post={article} height='190px' />
                ))}
                </div>
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Music</h4>
            <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                {entertainmentArticles.slice(9, 13).map((article) => (
                <ArticleBlock key={article.id} post={article} height='230px' />
                ))}
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Books</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                {(() => {
                const posts = entertainmentArticles.slice(13, 15);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
                {(() => {
                const posts = entertainmentArticles.slice(15, 17);
                return posts.length ? <SmallArticle posts={posts} direction="left"/> : null;
                })()}
            </div>

            <hr className='my-4' />

            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Comics</h4>
            <div className='flex gap-4 overflow-x-auto'>
                {entertainmentArticles.slice(17, 20).map((article) => (
                <Comic key={article.id} post={article} height='190px' />
                ))}
            </div>
            </div>

            <div className='flex flex-col gap-4'>
            <iframe
                className="rounded-md w-full h-[550px]"
                src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            />
            {(() => {
                const posts = [entertainmentArticles[6], entertainmentArticles[7], entertainmentArticles[16], entertainmentArticles[22]]
                .filter(Boolean) as Post[];
                return posts.length ? <SideArticle posts={posts} width='28%'/> : null;
            })()}
            </div>
        </div>
        </>
    )
}

export default Entertainment;
