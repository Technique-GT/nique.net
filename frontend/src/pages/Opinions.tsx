import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import ArticleBlock from "../components/ArticleBlock";
import { ArticleDocument, Category } from '../types/article';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import FeaturedStory from '../components/FeaturedStory';
import SmallArticle from '../components/SmallArticle';
import { Categories } from '../types/categories';
import InfiniteScrollModule from '../components/InfiniteScrollModule';
import { getArticleId, getArticleTimestamp } from '../utils/articlePresentation';

// Helper to process raw articles into page sections
const processOpinionArticles = (allOpinions: ArticleDocument[]) => {
    const sortByPublishedDesc = (a: ArticleDocument, b: ArticleDocument) =>
        getArticleTimestamp(b) - getArticleTimestamp(a);

    const stickyPosts = allOpinions.filter((article) => article.isSticky).sort(sortByPublishedDesc);
    const featuredPosts = allOpinions.filter((article) => article.isFeatured).sort(sortByPublishedDesc);
    const nonStickyPosts = allOpinions.filter((article) => !article.isSticky).sort(sortByPublishedDesc);
    const orderedOpinion = [...stickyPosts, ...nonStickyPosts];

    const featured = featuredPosts[0] ?? null;
    const orderedWithoutFeatured = featured
        ? orderedOpinion.filter((article) => getArticleId(article) !== getArticleId(featured))
        : orderedOpinion;
    const recentSelection = [featured, ...orderedWithoutFeatured].filter(Boolean) as ArticleDocument[];
    const recentIds = new Set(recentSelection.slice(0,1).map(getArticleId));

    const filterBySubcategory = (articles: ArticleDocument[], subcategory: string) =>
        articles
            .filter((article) => {
                if (article.subcategoryId && typeof article.subcategoryId === 'object') {
                    return article.subcategoryId.name?.toLowerCase() === subcategory.toLowerCase();
                }
                return false;
            })
            .filter((article) => !recentIds.has(getArticleId(article)))
            .sort(sortByPublishedDesc);

    return {
        recentOpinionArticles: recentSelection,
        opEdArticles: filterBySubcategory(allOpinions, 'op ed'),
        consensusArticles: filterBySubcategory(allOpinions, 'consensus'),
        lettersArticles: filterBySubcategory(allOpinions, 'letters to the editor'),
    };
};

function Opinions() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentOpinionArticles, setRecentOpinionArticles] = useState<ArticleDocument[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [opinionCategoryId, setOpinionCategoryId] = useState<string | null>(null);
    const [opEdArticles, setOpEdArticles] = useState<ArticleDocument[]>([]);
    const [consensusArticles, setConsensusArticles] = useState<ArticleDocument[]>([]);
    const [lettersArticles, setLettersArticles] = useState<ArticleDocument[]>([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const categories = await articleService.fetchCategories(50, controller.signal);

                const opinionCategory = categories.find((category: Category) =>
                    category.name?.toLowerCase() === Categories.OPINION.toLowerCase()
                );
                setOpinionCategoryId(typeof opinionCategory?._id === 'string' ? opinionCategory._id : null);

                if (!opinionCategory?._id) {
                    if (!isMounted) return;
                    setError('Opinion category not found.');
                    return;
                }

                const opinionResponse = await articleService.fetchArticlesByCategory(
                    opinionCategory._id,
                    undefined,
                    controller.signal
                );

                const allOpinions = opinionResponse || [];

                if (!isMounted) {
                    return;
                }

                const processed = processOpinionArticles(allOpinions);
                setRecentOpinionArticles(processed.recentOpinionArticles);
                setOpEdArticles(processed.opEdArticles);
                setConsensusArticles(processed.consensusArticles);
                setLettersArticles(processed.lettersArticles);
            } catch {
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
            <div className='w-full min-h-screen'>
                {/* Main */}
                <div className='grid gap-5 grid-cols-1 w-full h-[80vh]'>
                    <div className='flex flex-col gap-4 order-first row-span-4'>
                        {recentOpinionArticles[0] && <FeaturedStory article={recentOpinionArticles[0]} priority={true} />}
                    </div>
                </div>

                <hr className='my-3'/>

                {/* Subcategories */}
                <h4 className="font-bold mb-2 text-2xl text-nique-blue">Op Ed</h4>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    {opEdArticles.slice(0,8).map((article) => (
                        <ArticleBlock key={article._id || article.slug} article={article} height='230px' />
                    ))}
                </div>

                <hr className='my-3'/>
                
                <h4 className="font-bold mb-2 text-2xl text-nique-blue">Consensus</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(() => {
                        const articles = consensusArticles.slice(0, 2);
                        return articles.length ? (
                        <SmallArticle articles={articles} direction="left" />
                        ) : null;
                    })()}
                    {(() => {
                        const articles = consensusArticles.slice(2, 4);
                        return articles.length ? (
                        <SmallArticle articles={articles} direction="left" />
                        ) : null;
                    })()}
                </div>


                <InfiniteScrollModule categoryId={opinionCategoryId ?? undefined} />
            </div>

            <div className='flex flex-col gap-4'>
                <h4 className="font-bold text-2xl text-nique-blue">Letters to the Editor</h4>
                <hr />
                <SmallArticle articles={lettersArticles.slice(0,10)} direction="right" />
                
            </div>
        </div>
        </>
    )
}

export default Opinions;
