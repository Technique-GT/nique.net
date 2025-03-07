import { useEffect, useState } from 'react'
import MockAPI from '../services/MockAPI'
import ArticleBlock from "../components/ArticleBlock"
import { Post } from '../types/article'
import SideWidget from '../components/SideWidget';
import SideArticle from '../components/SideArticle';
import Carousel from '../components/Carousel';
import Navbar from '../components/Navbar';


function Life() {
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
                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Most Recent</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='lg:col-span-2 '>
                            <ArticleBlock post={post[0]} height='460px' />
                        </div>
                        <ArticleBlock post={post[1]} height='460px' />
                        <div className='grid gap-4 grid-rows-2'>
                            <ArticleBlock post={post[2]} height='222px' />
                            <ArticleBlock post={post[3]} height='222px' />
                        </div>
                        <div className='lg:col-span-4 m-0'>
                            <Carousel posts={[post[1], post[2], post[3], post[4]]} width='80%'/>
                        </div>
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">Tech Fashion</h4>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        <ArticleBlock post={post[4]} height='230px' />
                        <ArticleBlock post={post[5]} height='230px' />
                        <ArticleBlock post={post[6]} height='230px' />
                        <ArticleBlock post={post[7]} height='230px' />
                    </div>

                    <hr className='my-4' />

                    <h4 className="font-bold mb-2 text-2xl text-nique-blue">More Stories</h4>
                    <div className='grid gap-4 grid-cols-1 lg:grid-rows-3 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='row-span-2 col-span-2'>
                            <SideArticle posts={[post[6], post[7], post[8], post[16]]} width='18%' />
                        </div>
                        <div className='grid row-span-2 col-span-2 gap-4 lg:gap-y-0'>
                            <div className='col-span-2'>
                                <ArticleBlock post={post[9]} height='222px' />
                            </div>
                            <ArticleBlock post={post[10]} height='222px' />
                            <ArticleBlock post={post[11]} height='222px' />
                        </div>
                        <div className='col-span-2'>
                            <ArticleBlock post={post[12]} height='230px' />
                        </div>
                        <ArticleBlock post={post[13]} height='230px' />
                        <ArticleBlock post={post[14]} height='230px' />
                    </div>

                </div>

                <div className='flex flex-col gap-4'>
                    <SideWidget />
                    <SideArticle posts={[post[6], post[7], post[16]]} width='28%'/>
                    <iframe className="rounded-md w-full h-[550px]" src="https://open.spotify.com/embed/playlist/3ySGGWEXxBBYvn2cYxEDEx?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                </div>
            </div>
        </>
    )
}

export default Life
