import { useNavigate } from 'react-router-dom'
import { ArticleProps } from '../types/article'

function JustInBlock({ post }: ArticleProps) {
    const navigate = useNavigate();
    return (
        <div className='flex flex-col sm:flex-row gap-4 content-center cursor-pointer' onClick={() => navigate('news/' + post.id)}>
            <button className='bg-[#1A1E47] m-auto sm:m-0 rounded-md text-white h-[42px] w-[94px] cursor-pointer' onClick={() => navigate('news/' + post.id)}><h4 className='font-bold uppercase text-xl'>Just In</h4></button>
            <div>
                <h3 className="title text-center sm:text-left text-black font-bold text-2xl/5 mb-1">{post.title}</h3>
                <h6 className="text-center sm:text-left text-[#BAC0FF] text-sm">15 min. ago</h6>
            </div>
        </div>
    )
}

export default JustInBlock