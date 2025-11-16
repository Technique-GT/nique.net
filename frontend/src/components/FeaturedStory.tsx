import { useNavigate } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'

function FeaturedStory({ post, height }: ArticleBlockProps) {
    const navigate = useNavigate();
    return (
        <div>
            <div className='cursor-pointer rounded-md bg-cover bg-center h-full w-full flex p-4'
                onClick={() => navigate('/' + post.id)}
                style={{
                    backgroundImage: `linear-gradient(to top, transparent 70%, rgba(229, 229, 229) 90%), url(${post.featuredImage?.url})`,
                    height: `${height}`
                }}>
                <div>
                    <h4 className="text-[#1A1E47] font-bold text-xl mb-1">Featured Story</h4>
                    <h3 className="title text-black font-bold text-3xl/7 mb-2">{post.title}</h3>
                    <h6 className="text-[#1A1E47] text-sm"><span className="uppercase">{post.category}</span> &#8226; {post.author}</h6>
                </div>
            </div>

            <h6 className="text-nique-blue text-xs mt-1">{post.featuredImage?.caption}</h6>
            <p
                className="mt-2 overflow-hidden"
                style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}
            >
                {post.desc}
            </p>
            <p><a className='text-nique-blue-hover underline cursor-pointer' onClick={() => navigate('/' + post.id)}>[Read more...]</a></p>
        </div>
    )
}

export default FeaturedStory