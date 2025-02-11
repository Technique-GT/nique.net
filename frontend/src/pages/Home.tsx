import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'

function Home() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [post, setPost] = useState<Post[]>([]);

    useEffect(() => {
        getPost();
    }, [])
  
    const getPost = () => {
        MockAPI.getPost.then(resp => {
            const result = resp.data.slice(0, 20).map((item: any) => ({
                id: item.id,
                title: item.title,
                desc: item.summary,
                author: item.user.first_name + " " + item.user.last_name,
                category: item.category,
                coverImage: item.featured_image
            }));
            setPost(result);
            setIsLoading(false);
        })
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className='p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <ArticleBlock post={post[3]} height='200px' />
                <ArticleBlock post={post[4]} height='200px' />
                <ArticleBlock post={post[5]} height='200px' />
                <ArticleBlock post={post[6]} height='200px' />
                <ArticleBlock post={post[7]} height='200px' />
                <ArticleBlock post={post[8]} height='200px' />
            </div>
        </>
    )
}

export default Home
