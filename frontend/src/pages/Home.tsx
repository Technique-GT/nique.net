import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
import FeaturedStory from '../components/FeaturedStory';
import JustInBlock from '../components/JustIn';
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import { Categories } from '../types/categories';

function Home() {
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
            <div className='max-w-[1470px] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'>
                <div className='w-full'>
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] w-full'>
                        <div className='flex flex-col gap-4 order-last lg:order-first'>
                            <ArticleBlock post={post[3]} height='200px' />
                            <ArticleBlock post={post[4]} height='200px' />
                            <ArticleBlock post={post[5]} height='200px' />
                            <ArticleBlock post={post[9]} height='200px' />
                        </div>
                        <div className='flex flex-col gap-4'>
                            <JustInBlock post={post[0]} />
                            <FeaturedStory post={post[12]} height='695px' />
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.LIFE}</h4>
                    <div className='grid grid-cols-1 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            <ArticleBlock post={post[8]} height='396px' />
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            <ArticleBlock post={post[10]} height='190px' />
                            <ArticleBlock post={post[11]} height='190px' />
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.NEWS}</h4>
                    <div className='flex flex-col sm:flex-row gap-4'>
                        <ArticleBlock post={post[13]} height='200px' />
                        <ArticleBlock post={post[14]} height='200px' />
                        <ArticleBlock post={post[15]} height='200px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <ArticleBlock post={post[16]} height='230px' />
                        <ArticleBlock post={post[17]} height='230px' />
                        <ArticleBlock post={post[18]} height='230px' />
                        <ArticleBlock post={post[19]} height='230px' />
                        <ArticleBlock post={post[20]} height='230px' />
                        <ArticleBlock post={post[21]} height='230px' />
                        <ArticleBlock post={post[22]} height='230px' />
                        <ArticleBlock post={post[23]} height='230px' />
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle posts={[post[6], post[7], post[16]]} />
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Home
