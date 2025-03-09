import { useEffect, useState } from 'react';
import MockAPI from '../services/MockAPI';
import ArticleBlock from "../components/ArticleBlock";
import { Post } from '../types/article';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import SmallArticle from '../components/SmallArticle';
import Comic from '../components/Comic';
import Navbar from '../components/Navbar';

function HomePage() {
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
        return <div>Loading...</div>;
    }

    return (
        <>
            <Navbar />
            <div className='max-w-[1470px] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div className='w-full'>
                <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                     <div className='lg:col-span-4 m-0'>
                        <Carousel posts={[post[1], post[2], post[3], post[4]]} width='70%'/>
                    </div>
                    </div>
                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Movies and Shows</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {/* Large Feature Article on the Left */}
                        <div className='lg:col-span-2 sm:col-span-2'>
                            <ArticleBlock post={post[4]} height='400px'/>
                        </div>

                        {/* Four Smaller Articles in Grid */}
                        <div className='grid gap-4 grid-cols-2 lg:col-span-2'>
                            <ArticleBlock post={post[5]} height='190px' />
                            <ArticleBlock post={post[6]} height='190px' />
                            <ArticleBlock post={post[7]} height='190px' />
                            <ArticleBlock post={post[8]} height='190px' />
                        </div>
                    </div>


                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Music</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <ArticleBlock post={post[8]} height='230px' />
                        <ArticleBlock post={post[9]} height='230px' />
                        <ArticleBlock post={post[10]} height='230px' />
                        <ArticleBlock post={post[11]} height='230px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Books</h4>
                    <div className='grid grid-cols-2 gap-4 items-start'>
                        <SmallArticle posts={[post[6], post[7]]} direction="left"/>
                        <SmallArticle posts={[post[8], post[9]]} direction="left"/>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Comics</h4>
                    <div className='flex gap-4 overflow-x-auto'>
                        <Comic post={post[14]} height='190px' />
                        <Comic post={post[15]} height='190px' />
                        <Comic post={post[16]} height='190px' />
        
                    </div>



                </div>

                <div className='flex flex-col gap-4'>
                    
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                    <SideArticle posts={[post[6], post[7], post[16], post[22]]} width='28%'/>
                </div>
                <div className='flex flex-col gap-4'>
                    
                    
                    
                </div>
            </div>
        </>
    )
}

export default HomePage;
