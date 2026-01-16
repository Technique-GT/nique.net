import { useNavigate } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'

interface FeaturedStoryProps extends ArticleBlockProps {
    priority?: boolean;
}

function FeaturedStory({ post, priority = false }: FeaturedStoryProps) {
    const navigate = useNavigate();
    const link = post.categorySlug && post.slug ? `/${post.categorySlug}/${post.slug}` : `/${post.id}`;
    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="relative cursor-pointer rounded-md w-full flex p-4 flex-1 min-h-0 overflow-hidden group"
                onClick={() => navigate(link)}
            >
                {post.featuredImage?.url && (
                    <img 
                        src={post.featuredImage.url} 
                        alt={post.title}
                        loading={priority ? "eager" : "lazy"}
                        decoding={priority ? "auto" : "async"}
                        fetchPriority={priority ? "high" : "auto"}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                    />
                )}

                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to top, transparent 70%, rgba(229, 229, 229) 90%)`
                    }}
                />

                <div className="relative z-10 pointer-events-none">
                    <h4 className="text-[#1A1E47] font-bold text-xl mb-1">Featured Story</h4>
                    <h3 className="title text-black font-bold text-3xl/7 mb-2">{post.title}</h3>
                    <h6 className="text-[#1A1E47] text-sm"><span className="uppercase">{post.category}</span> &#8226; {post.author}</h6>
                </div>
            </div>

            <h6 className="text-nique-blue text-xs mt-1">{post.imageCaption}</h6>
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
            <p><a className='text-nique-blue-hover underline cursor-pointer' onClick={() => navigate(link)}>[Read more...]</a></p>
        </div>
    )
}


export default FeaturedStory
