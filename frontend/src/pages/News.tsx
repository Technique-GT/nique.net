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
                    <div className='flex flex-col gap-4'>
                        <JustInBlock post={post[0]} />
                        <FeaturedStory post={post[12]} height='695px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Atlanta News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='col-span-2'>
                            <ArticleBlock post={post[9]} height='460px' />
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            <ArticleBlock post={post[10]} height='222px' />
                            <ArticleBlock post={post[11]} height='222px' />
                            <div className='col-span-2'>
                                <ArticleBlock post={post[9]} height='222px' />
                            </div>
                        </div>
                        <div className='col-span-2'>
                            <SideArticle posts={[post[12], post[13]]}/>
                        </div>
                        <div className='col-span-2'>
                            <SideArticle posts={[post[14], post[15]]}/>
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">U.S. News</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='grid grid-cols-2 gap-4 col-span-2'>
                            <ArticleBlock post={post[1]} height='222px' />
                            <ArticleBlock post={post[2]} height='222px' />
                            <ArticleBlock post={post[3]} height='222px' />
                            <ArticleBlock post={post[4]} height='222px' />
                        </div>
                        <div className='grid col-span-2 gap-4'>
                            <SideArticle posts={[post[5], post[6], post[7], post[8]]}/>
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">{Categories.ENTERTAINMENT}</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                        <ArticleBlock post={post[16]} height='230px' />
                        <ArticleBlock post={post[17]} height='230px' />
                        <ArticleBlock post={post[18]} height='230px' />
                        <ArticleBlock post={post[19]} height='230px' />
                        <ArticleBlock post={post[20]} height='230px' />
                        <ArticleBlock post={post[21]} height='230px' />
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
