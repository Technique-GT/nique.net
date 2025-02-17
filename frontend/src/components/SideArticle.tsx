import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'

function SideArticle({ posts }: ArticleListProps) {
    const navigate = useNavigate();
    return (
        <div>
            {posts.map((post) => (
                <div key={post.id}>
                    <div className='cursor-pointer w-full flex justify-between gap-5' onClick={() => navigate('news/' + post.id)}>
                        <div>
                            <h3 className="text-[#1A1E47] font-bold text-xl/6 mb-2">{post.title}</h3>
                            <h6 className="text-nique-blue text-sm">{post.author}</h6>
                        </div>
                        <img src={post.coverImage} className='w-[28%] aspect-square rounded-md object-cover' />
                    </div>
                    <hr className='my-3' />
                </div>
            ))}
        </div>
    )
}

export default SideArticle