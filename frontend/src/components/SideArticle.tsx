import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'

interface SideArticleProps extends ArticleListProps {
    hasBreak?: boolean;
    hasDesc?: boolean;
}

function SideArticle({ posts, hasBreak = true, hasDesc = false }: SideArticleProps ) {
    const navigate = useNavigate();
    return (
        <div className='w-full'>
            {posts.map((post) => (
                <div key={post.id}>
                    <div className='cursor-pointer w-full grid grid-cols-4 justify-between gap-1' onClick={() => navigate('/' + post.id)}>
                        <div className='col-span-3 flex flex-col justify-start'>
                            <h3 className="title text-[#1A1E47] font-bold text-xl/6 mb-2">{post.title}</h3>
                            <h6 className="text-nique-blue text-sm">{post.author}</h6>
                            
                        </div>
                        {post.featuredImage && (
                            <img
                                src={post.featuredImage?.url}
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
                            {post.desc}
                        </p>
                    }
                    {hasBreak ? <hr className='my-3' /> : <div className='my-3' />}
                </div>
            ))}
        </div>
    )
}

export default SideArticle