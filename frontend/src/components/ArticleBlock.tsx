import { useNavigate } from 'react-router-dom'
import { ArticleBlockProps } from '../types/article'

function ArticleBlock({ post, height }: ArticleBlockProps) {
    const navigate=useNavigate();
    return (
        <div className='cursor-pointer rounded-md bg-cover bg-center max-h-[50vh] md:max-h-none w-full flex items-end p-3'
        onClick={()=>navigate(`/news/${post.id}`)}
        style={{
            backgroundImage: `linear-gradient(to bottom, rgba(26, 30, 71, 0.15), rgba(26, 30, 71, 1) 75%), url(${post.coverImage})`,
            height: `${height}`
        }}>
            <div>
                <h3 className="title text-white font-bold text-2xl/7 mb-2">{post.title}</h3>
                <h6 className="text-[#BAC0FF] text-sm"><span className="uppercase">{post.category}</span> &#8226; {post.author}</h6>
            </div>
        </div>
    )
}

export default ArticleBlock