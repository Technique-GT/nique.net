import { useNavigate } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'
import {
  getArticleAuthorName,
  getArticleCategoryName,
  getArticleImage,
  getArticleLink,
} from '../utils/articlePresentation'
import { articleCache } from '../services/articleCache'

function ArticleBlock({ article, height }: ArticleBlockProps) {
    const navigate = useNavigate();
    const link = getArticleLink(article);
    const image = getArticleImage(article);
    const category = getArticleCategoryName(article);
    const author = getArticleAuthorName(article);

    const handleClick = () => {
      // Pre-cache the article data so the Article page doesn't flash "not found"
      articleCache.set(article);
      navigate(link);
    };

    return (
        <div 
            className='relative cursor-pointer rounded-md max-h-[50vh] md:max-h-none w-full flex items-end p-3 overflow-hidden group'
            onClick={handleClick}
            style={{ height: `${height}` }}
        >
            {image && (
                <img 
                    src={image} 
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                />
            )}
            
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, rgba(26, 30, 71, 0.15), rgba(26, 30, 71, 1) 85%)'
                }}
            />

            <div className="relative z-10 w-full pointer-events-none">
                <h3
                    className="title text-white font-bold text-[clamp(1rem,0.8rem+1vw,1.5rem)]/7 mb-2 overflow-hidden"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {article.title}
                </h3>
                <h6 className="text-[#BAC0FF] text-sm"><span className="uppercase">{category}</span> &#8226; {author}</h6>
            </div>
        </div>
    )
}

export default ArticleBlock
