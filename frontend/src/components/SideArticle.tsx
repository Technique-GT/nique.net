import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'

interface SideArticleProps extends ArticleListProps {
    hasBreak?: boolean;
    hasDesc?: boolean;
}

function SideArticle({ posts, width = '28%', hasBreak = true, hasDesc = false }: SideArticleProps ) {
    const navigate = useNavigate();
    return (
        <div>
            {posts.map((post) => (
                <div key={post.id}>
                    <div className='cursor-pointer w-full flex justify-between gap-5' onClick={() => navigate('news/' + post.id)}>
                        <div>
                            <h3 className="title text-[#1A1E47] font-bold text-xl/6 mb-2">{post.title}</h3>
                            <h6 className="text-nique-blue text-sm">{post.author}</h6>
                            {hasDesc && <p className="text-[#1A1E47] text-sm">{post.desc}</p>}
                        </div>
                        <img 
                            src={post.coverImage} 
                            style = {{ width: `${width}` }}
                            className='aspect-square h-auto rounded-md object-cover' />
                    </div>
                    {hasBreak ? <hr className='my-3' /> : <div className='my-3' />}
                </div>
            ))}
        </div>
    )
}

export default SideArticle