import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'
import { getArticleAuthorName, getArticleDescription, getArticleImage, getArticleLink } from '../utils/articlePresentation'

interface SideArticleProps extends ArticleListProps {
    hasBreak?: boolean;
    hasDesc?: boolean;
}

function SideArticle({ articles, hasBreak = true, hasDesc = false }: SideArticleProps ) {
    const navigate = useNavigate();
    return (
        <div className='w-full'>
            {articles.map((article) => {
                const link = getArticleLink(article);
                const image = getArticleImage(article);
                const author = getArticleAuthorName(article);
                const desc = getArticleDescription(article);
                return (
                <div key={article._id || article.slug}>
                    <div className='cursor-pointer w-full grid grid-cols-4 justify-between gap-1' onClick={() => navigate(link)}>
                        <div className='col-span-3 flex flex-col justify-start'>
                            <h3 className="title text-[#1A1E47] font-bold text-xl/6 mb-2">{article.title}</h3>
                            <h6 className="text-nique-blue text-sm">{author}</h6>
                            
                        </div>
                        {image && (
                            <img
                                src={image}
                                loading="lazy"
                                alt={article.title}
                                className='aspect-square w-full rounded-md object-cover col-span-1'
                            />
                        )}
                    </div>
                    {hasDesc && 
                        <p className="text-[#1A1E47] text-sm overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            }}>
                            {desc}
                        </p>
                    }
                    {hasBreak ? <hr className='my-3' /> : <div className='my-3' />}
                </div>
            )})}
        </div>
    )
}

export default SideArticle
