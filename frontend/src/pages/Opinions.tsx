import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideArticle from '../components/SideArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import FeaturedStory from '../components/FeaturedStory';
import SmallArticle from '../components/SmallArticle';
import { Categories } from '../types/categories';
import InfiniteScrollModule from '../components/InfiniteScrollModule';

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
    };
};

function Opinions() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentOpinionArticles, setRecentOpinionArticles] = useState<Post[]>([]);
    const [opinionArticles, setOpinionArticles] = useState<Post[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [opinionCategoryId, setOpinionCategoryId] = useState<string | null>(null);
    const [opEdArticles, setOpEdArticles] = useState<Post[]>([]);
    const [consensusArticles, setConsensusArticles] = useState<Post[]>([]);
    const [lettersArticles, setLettersArticles] = useState<Post[]>([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadArticles = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const categoriesResponse = await articleService.fetchCategories(50, controller.signal);
            const categories = categoriesResponse.data || [];

            const opinionCategory = categories.find((category: any) =>
                category.name?.toLowerCase() === Categories.OPINION.toLowerCase()
            );
            setOpinionCategoryId(typeof opinionCategory?._id === 'string' ? opinionCategory._id : null);

            if (!opinionCategory?._id) {
                if (!isMounted) return;
                setOpinionArticles([]);
                setError('Opinion category not found.');
                return;
            }

            const opinionResponse = await articleService.fetchArticles(
            { category: opinionCategory._id, status: 'published' },
            controller.signal
            );

            const mapResponseData = (data: any[] | undefined) => (data || []).map(mapArticleToPost);
            const allOpinions = mapResponseData(opinionResponse.data);
            const getTimestamp = (post: Post) => {
                const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
                const created = post.createdAt ? new Date(post.createdAt).getTime() : 0;
                return Math.max(published, created);
            };
            const sortByPublishedDesc = (a: Post, b: Post) => getTimestamp(b) - getTimestamp(a);

            const stickyPosts = allOpinions.filter((post) => post.isSticky).sort(sortByPublishedDesc);
            const nonStickyPosts = allOpinions.filter((post) => !post.isSticky).sort(sortByPublishedDesc);
            const orderedOpinion = [...stickyPosts, ...nonStickyPosts];
            const RECENT_COUNT = Math.max(5, stickyPosts.length);
            const recentSelection = orderedOpinion.slice(0, RECENT_COUNT);
            const remainingOpinion = orderedOpinion.slice(RECENT_COUNT);
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

            setRecentOpinionArticles(recentSelection);
            setOpinionArticles(remainingOpinion);
            setOpEdArticles(filterBySubcategory(opinionResponse.data || [], 'op ed'));
            setConsensusArticles(filterBySubcategory(opinionResponse.data || [], 'consensus'));
            setLettersArticles(filterBySubcategory(opinionResponse.data || [], 'letters to the editor'));
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
                <div className='grid grid-cols-1 gap-4'>
                    {recentOpinionArticles[0] && <FeaturedStory post={recentOpinionArticles[0]} height='670px' />}
                </div>

                <hr className='my-3'/>

                <h4 className="font-bold mb-2 text-2xl text-nique-blue">Op Ed</h4>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    {opEdArticles.map((article) => (
                        <ArticleBlock key={article.id} post={article} height='230px' />
                    ))}
                </div>

                <hr className='my-3'/>
                
                <h4 className="font-bold mb-2 text-2xl text-nique-blue">Consensus</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(() => {
                        const posts = consensusArticles.slice(0, 2);
                        return posts.length ? (
                        <SmallArticle posts={posts} direction="left" />
                        ) : null;
                    })()}
                    {(() => {
                        const posts = consensusArticles.slice(2, 4);
                        return posts.length ? (
                        <SmallArticle posts={posts} direction="left" />
                        ) : null;
                    })()}
                </div>


                <InfiniteScrollModule categoryId={opinionCategoryId ?? undefined} />
            </div>

            <div className='flex flex-col gap-4'>
                {(() => {
                const posts = recentOpinionArticles.slice(1, 6);
                return posts.length ? (
                    <SideArticle posts={posts} width='80px' hasDesc={true}/>
                ) : null;
                })()}

                <h4 className="font-bold text-2xl text-nique-blue">Letters to the Editor</h4>
                <hr />
                <div className='grid grid-cols-3 gap-4'>
                    {lettersArticles.slice(0, 3).map((article) => (
                    <ArticleBlock key={article.id} post={article} height='190px' />
                    ))}
                </div>
            </div>
        </div>
        </>
    )
}

export default Opinions;
