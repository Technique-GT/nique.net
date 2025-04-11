import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
import VerticalAd from "../components/VerticalAd";
import MockAd from '../assets/mock_advertisement.jpg';
import SideArticle from '../components/SideArticle';
import InstagramEmbed from '../components/InstaEmbed';
import SmallArticle from '../components/SmallArticle';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import FeaturedStory from '../components/FeaturedStory';

function Opinions() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [post, setPost] = useState<Post[]>([]);

    useEffect(() => {
        getPost();
    }, [])

    const getPost = () => {
        MockAPI.getPost.then(resp => {
            const result = resp.data.slice(0, 25).map((item: any) => ({
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
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
        );
    }

    return (
        <>
            <Navbar />

            <div className='max-w-[1470px] m-auto p-5 flex flex-col gap-8'>
                <div className='grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4'>
                        <FeaturedStory post={post[11]} height='670px' />
                        <div className='flex flex-col gap-4'>
            
                        <div className='flex flex-col gap-4'>
                        <SideArticle posts={[post[3], post[10], post[16], post[2]]} width='80px' hasDesc = { true }/>
                        </div>
                     
                            
                        </div>
                    </div>
                    <hr/>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                        <ArticleBlock post={post[4]} height='300px' />
                        <ArticleBlock post={post[5]} height='300px' />
                        <ArticleBlock post={post[6]} height='300px' />
                        <ArticleBlock post={post[7]} height='300px' />
                
                        
                    </div>
                   
                </div>
           
        </>
    )
}

export default Opinions
