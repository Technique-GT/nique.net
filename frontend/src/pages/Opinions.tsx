import { useCallback } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideArticle from '../components/SideArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import FeaturedStory from '../components/FeaturedStory';
import SmallArticle from '../components/SmallArticle';
import { Categories } from '../types/categories';
import { mapArticleToPost, RawArticle } from '../utils/articleUtils';
import { useAsyncData } from '../hooks/useAsyncData';

interface OpinionArticlesData {
    opinionArticles: Post[];
}

const emptyOpinionsData: OpinionArticlesData = {
    opinionArticles: [],
};

function Opinions() {
    const loadOpinionArticles = useCallback(async (signal: AbortSignal): Promise<OpinionArticlesData> => {
        const categoriesResponse = await articleService.fetchCategories(50, signal);
        const categories: Array<{ _id?: string; name?: string }> = categoriesResponse.data || [];

        const opinionCategory = categories.find((category) =>
            category.name?.toLowerCase() === Categories.OPINION.toLowerCase()
        );

        if (!opinionCategory?._id) {
            throw new Error('Opinion category not found.');
        }

        const opinionResponse = await articleService.fetchArticlesByCategory(
            opinionCategory._id,
            undefined,
            signal
        );

        const articles = (opinionResponse.data || []) as RawArticle[];

        return {
            opinionArticles: articles.map((article) => mapArticleToPost(article)),
        };
    }, []);

    const {
        data: {
            opinionArticles,
        },
        isLoading,
        error,
    } = useAsyncData<OpinionArticlesData>(loadOpinionArticles, {
        initialData: emptyOpinionsData,
        errorMessage: 'Unable to load articles. Please try again later.',
    });

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

        <div className='max-w-[1470px] m-auto p-5 flex flex-col gap-8'>
            <div className='grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4'>
            {opinionArticles[0] && <FeaturedStory post={opinionArticles[0]} height='670px' />}
            <div className='flex flex-col gap-4'>
                {(() => {
                const posts = opinionArticles.slice(1, 5);
                return posts.length ? (
                    <SideArticle posts={posts} width='80px' hasDesc={true}/>
                ) : null;
                })()}
            </div>
            </div>
            <hr/>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            {opinionArticles.slice(5, 9).map((article) => (
                <ArticleBlock key={article.id} post={article} height='300px' />
            ))}
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {(() => {
                const posts = opinionArticles.slice(9, 11);
                return posts.length ? (
                <SmallArticle posts={posts} direction="left" />
                ) : null;
            })()}
            {(() => {
                const posts = opinionArticles.slice(11, 13);
                return posts.length ? (
                <SmallArticle posts={posts} direction="left" />
                ) : null;
            })()}
            </div>
        </div>
        </>
    )
}

export default Opinions;
