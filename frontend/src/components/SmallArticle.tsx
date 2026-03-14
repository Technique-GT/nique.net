import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'
import { getArticleAuthorName, getArticleImage, getArticleLink } from '../utils/articlePresentation'

interface SmallArticleProps extends ArticleListProps {
    direction: "right" | "left";  // Direction can be either 'right' or 'left'
}

function SmallArticle({ articles, direction }: SmallArticleProps) {
    const navigate = useNavigate();
    return (
        <div>
            {articles.map((article, index) => {
                const link = getArticleLink(article);
                const image = getArticleImage(article);
                const author = getArticleAuthorName(article);
                return (
                <div key={article._id || article.slug || index}>
                    <div className={`${direction === "right" ? "justify-between" : "justify-start"}
                    cursor-pointer w-full flex gap-4`}
                        onClick={() => navigate(link)}>
                        <div>
                            <h3 className="title text-[#1A1E47] font-bold text-xl/6 mb-2">{article.title}</h3>
                            <h6 className="text-nique-blue text-sm">{author}</h6>
                        </div>
                        {
                            image && 
                            <img 
                                src={image} 
                                loading="lazy"
                                decoding="async"
                                alt={article.title}
                                className={`${direction === "right" ? "" : "order-first"} w-32 border-0 aspect-3/2 rounded-md object-cover`} 
                            />
                        }
                    </div>
                    {/* Show <hr /> only if it's not the last post */}
                    {index !== articles.length - 1 && <hr className='my-3' />}
                </div>
            )})}
        </div>
    )
}

export default SmallArticle
