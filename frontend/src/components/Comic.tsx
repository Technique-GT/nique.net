import { ArticleBlockProps } from '../types/article';
import { useNavigate } from 'react-router-dom'




function Comic({ post, height }: ArticleBlockProps) {
    const navigate=useNavigate();
    return (
        <div className='cursor-pointer rounded-md bg-cover bg-center max-h-[50vh] md:max-h-none w-full flex items-end p-3'
        onClick={()=>navigate('news/'+post.id)}
        style={{
            backgroundImage: `linear-gradient(to bottom, rgba(26, 30, 71, 0.10), rgb(26, 30, 71) 90%), url(${post.coverImage})`,
            height: `${height}`
        }}>
            
        </div>
    )
}

export default Comic;
