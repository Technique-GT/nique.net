import { useNavigate } from 'react-router-dom'
import { ArticleListProps } from '../types/article'

interface SmallArticleProps extends ArticleListProps {
    direction: "right" | "left";  // Direction can be either 'right' or 'left'
}

function SmallArticle({ posts, direction }: SmallArticleProps) {
    const navigate = useNavigate();
    return (
        <div>
            {posts.map((post, index) => (
                <div key={post.id}>
                    <div className={`${direction === "right" ? "justify-between" : "justify-start"}
                    cursor-pointer w-full flex gap-4`}
                        onClick={() => navigate('news/' + post.id)}>
                        <div>
                            <h3 className="title text-[#1A1E47] font-bold text-xl/6 mb-2">{post.title}</h3>
                            <h6 className="text-nique-blue text-sm">{post.author}</h6>
                        </div>
                        <img src={post.coverImage} className={`${direction === "right" ? "" : "order-first"} w-[28%] aspect-3/2 rounded-md object-cover`} />
                    </div>
                    {/* Show <hr /> only if it's not the last post */}
                    {index !== posts.length - 1 && <hr className='my-3' />}
                </div>
            ))}
        </div>
    )
}

export default SmallArticle