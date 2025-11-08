import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import { Post } from '../types/article';
import { FaFacebook, FaXTwitter, FaInstagram, FaTiktok, FaLinkedin } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import Collage from "../components/Collage";
import Spinner from '../components/Spinner';
import { mapArticleToPost } from '../utils/articleMapping';

function About() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentArticles, setRecentArticles] = useState<Post[]>([]);

    useEffect(() => {
            let isMounted = true;
            const controller = new AbortController();
    
            const loadArticles = async () => {
                setIsLoading(true);
    
                try {
                    const [recentResponse] = await Promise.all([
                        articleService.fetchRecentArticles(5, 'published', controller.signal),
                    ]);
    
                    if (!isMounted) {
                        return;
                    }
    
                    setRecentArticles((recentResponse.data || []).map(mapArticleToPost));
                } catch (err) {
                    if (!isMounted) {
                        return;
                    }
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }
            };
    
            loadArticles();
    
            return () => {
                isMounted = false;
                controller.abort();
            };
        }, []);

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

            <div className='max-w-[1470px] m-auto p-5'>
                <h4 className="font-bold mb-2 text-2xl text-nique-blue">About Us</h4>
            </div>

            <Collage posts={[recentArticles[0], recentArticles[1], recentArticles[2], recentArticles[3], recentArticles[4], recentArticles[5]]} /> {/* collection of best pictures you may want to feature */}

            {/* Mission */}
            <div className='grid grid-cols-1 sm:grid-cols-3 max-w-[1470px] m-auto p-5 gap-x-16'>
                <div className='col-span-1 sm:col-span-2'>
                    <h4 className='text-2xl font-bold text-nique-blue my-6'>Our Mission</h4>
                    <p className='text-lg mt-5'>The purpose of the <i>Technique</i> is to serve the campus community by providing information, analysis and opinions that reflect the needs and interests of the student body at Georgia Tech.</p>
                </div>
                <div className='col-span-1 ml-20 mt-8 p-8 bg-nique-blue text-white'>
                    <h4 className='text-2xl font-bold text-right mb-4'>Follow Technique</h4>
                    <p className="flex gap-2 justify-end items-center text-white">
                        <a className='hover:text-gray-100' href='https://www.facebook.com/thenique' target='_blank'><FaFacebook /></a>
                        <a className='hover:text-gray-100' href='https://twitter.com/the_nique' target='_blank'><FaXTwitter /></a>
                        <a className='hover:text-gray-100' href='https://www.instagram.com/gt_nique' target='_blank'><FaInstagram /></a>
                        <a className='hover:text-gray-100' href='https://www.tiktok.com/@gt_nique' target='_blank'><FaTiktok /></a>
                        <a className='hover:text-gray-100' href='https://www.linkedin.com/company/technique-newspaper/' target='_blank'><FaLinkedin /></a>
                    </p>
                </div>
            </div>

            {/* Vision */}
            <div className='max-w-[1470px] m-auto p-5'>
                <h4 className='text-2xl font-bold text-nique-blue my-6'>Our Vision</h4>
                <p className='text-lg mt-5'>
                    Founded in 1911, the <i>Technique</i> serves as the campus newspaper for the Tech community. Our mission consists of four main pillars:
                </p>
                <ol className="list-decimal ml-8 mt-3 text-lg">
                    <li className="mt-2">
                        Inform and entertain the student body by publishing articles in a timely manner that:
                        <ol className="list-decimal ml-8 mt-1">
                            <li>Are of interest to the student body</li>
                            <li>Meet the highest standards of quality and ethics</li>
                            <li>Live up to the reputation of being “The South's Liveliest College Newspaper.”</li>
                        </ol>
                    </li>
                    <li className="mt-2">
                        Use our role as a college newspaper to provide unique content to the community by:
                        <ol className="list-decimal ml-8 mt-1">
                            <li>Providing coverage and analyses of news and events both on- and off-campus that affect the student body</li>
                            <li>Informing students about opportunities available on campus and around Atlanta to help them make decisions about how to spend their time</li>
                            <li>Offering a feature centric, in-depth look at important sports around campus in the simplest and most effective manner possible</li>
                        </ol>
                    </li>
                    <li className="mt-2">
                        Foster a sense of community by:
                        <ol className="list-decimal ml-8 mt-1">
                            <li>Representing student opinion by writing thought-provoking editorials and providing a vehicle through which other members of the community can do the same</li>
                            <li>Informing students about activities and initiatives in which they can take part to make an impact on Tech's campus</li>
                            <li>Using the resources available to capture the emotions and to tell the community's compelling stories</li>
                        </ol>
                    </li>
                    <li className="mt-2">
                        Be a place where students can:
                        <ol className="list-decimal ml-8 mt-1">
                            <li>Develop their writing, photography, design, business and leadership skills</li>
                            <li>Work in a safe and enjoyable environment and expect to be treated fairly and with respect</li>
                        </ol>
                    </li>
                </ol>
            </div>

            {/* Getting Involved */}
            <div className='max-w-[1470px] m-auto p-5'>
                <h4 className='text-2xl font-bold text-nique-blue my-6'>Getting Involved</h4>
                <p className='text-lg mt-5'>
                    Interested in writing, photography, sales or design? If so, the Technique has a lot to offer. Our staff is comprised entirely of Tech students interested 
                    in improving their writing, communication and design skills. If you are interested in any of the following, consider joining the Technique.
                </p>
                    <ul className='text-lg my-3 list-disc ml-8'>
                        <li>
                            <strong>Improving your writing skills:</strong> By joining the Technique, you will learn how to write articles for a range of different 
                            sections including News, Opinions, Life, Entertainment and Sports. In addition, you will learn how to interview sources and improve your skills 
                            to analyze information and ask the right questions.
                        </li>
                        <li>
                            <strong>Sales opportunities:</strong> As part of the business team, you can hone your salesmanship by selling ads for the paper. Sharpening 
                            your sales skills can help you become a better marketer or manager in your professional career.
                        </li>
                        <li>
                            <strong>Design skills:</strong> The Technique maintains two mediums of publication — both print and online formats. If you're interested in 
                            graphic design, you'll have the opportunity to work with section editors to help design the paper layout on a weekly basis, which will help you 
                            expand your graphic design portfolio.
                        </li>
                        <li>
                            <strong>Photography:</strong> Our staff is responsible for taking photos for the paper. Lessons on topics such as shooting sports, portraits, 
                            landscapes, etc., are held by fellow students.
                        </li>
                    </ul>

                <p className='text-lg'>
                    General Body Meetings are held weekly on Tuesdays at 7:00 p.m. in the Student Center in room 2150 (Student Media suite).
                </p>
                <p className='text-lg mt-3'>
                    Please join the 
                    <a href=" https://join.slack.com/t/techniquestaf-lba4588/shared_invite/zt-2p2rgiqtx-95XC_o1P~x2mOLihFDFA~Q" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='text-nique-light-blue hover:text-nique-blue-hover'> <u>Slack Channel</u> </a> 
                    if interested!
                </p>
            </div>
        </>
    )
}

export default About;
