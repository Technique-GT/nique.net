import { useNavigate } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'

function FeaturedStory({ post, height }: ArticleBlockProps) {
    const navigate = useNavigate();
    return (
        <div>
            <div className='cursor-pointer rounded-md bg-cover bg-center h-[200px] w-full flex p-4'
                onClick={() => navigate('news/' + post.id)}
                style={{
                    backgroundImage: `linear-gradient(to top, transparent 70%, rgba(229, 229, 229) 90%), url(${post.coverImage})`,
                    height: `${height}`
                }}>
                <div>
                    <h4 className="text-[#1A1E47] font-bold text-xl mb-1">Featured Story</h4>
                    <h3 className="text-black font-bold text-3xl/7 mb-2">{post.title}</h3>
                    <h6 className="text-[#1A1E47] text-sm"><span className="uppercase">{post.category}</span> &#8226; {post.author}</h6>
                </div>
            </div>
            <h6 className="text-nique-blue text-xs mt-1">Player Ashlyn Goolsby dives in for a save in a tension filled game. Longer captions for cover stories because hopefully they&rsquo;ll be Technique taken photos. Photo by: Student Publications</h6>
            <p className="mt-2">After the sweep against Florida at McCamish Pavilion, the Jackets went on the road to Athens, GA to face the u[sic]GA. Senior setter Ashlyn Goolsby reflects on the season thus far and the team&rsquo;s dynamics with the Technique.</p>
        </div>
    )
}

export default FeaturedStory