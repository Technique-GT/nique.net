import { useEffect, useState } from 'react';
import articleService from '../services/articleService';
import { getPublications } from '../services/publicationService';
import { ArticleDocument } from '../types/article';
import { Publication, formatPublicationDate } from '../utils/dateFormat';
import { FaFacebook, FaXTwitter, FaInstagram, FaTiktok, FaLinkedin } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import Collage from "../components/Collage";
import Spinner from '../components/Spinner';

function About() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [recentArticles, setRecentArticles] = useState<ArticleDocument[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadData = async () => {
            setIsLoading(true);

            try {
                const recentArticlesData = await articleService.fetchRecentArticles(7, 'published', controller.signal);
                if (isMounted) {
                    setRecentArticles(recentArticlesData || []);
                }
            } catch (err) {
                console.error('Failed to fetch recent articles:', err);
            }

            try {
                const publicationsData = await getPublications();
                if (isMounted) {
                    setPublications(publicationsData || []);
                }
            } catch (err) {
                console.error('Failed to fetch publication dates:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

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

            <div className='max-w-[95%] md:max-w-[80%] m-auto p-5'>
                <h4 className="font-bold mb-2 text-2xl text-nique-blue">About Us</h4>
            </div>

            <Collage articles={[recentArticles[0], recentArticles[1], recentArticles[2], recentArticles[3], recentArticles[4], recentArticles[5], recentArticles[6]].filter(Boolean) as ArticleDocument[]} />

            {/* Mission */}
            <div className='grid grid-cols-1 sm:grid-cols-3 max-w-[95%] md:max-w-[80%] m-auto p-5 gap-x-16'>
                <div className='col-span-1 sm:col-span-2'>
                    <h4 className='text-2xl font-bold text-nique-blue my-6'>Our Mission</h4>
                    <p className='text-lg mt-5'>The <i>Technique</i> serves the campus community by providing information, analysis and opinions that reflect the needs and interests of the student body at the Georgia Institute of Technology.</p>
                </div>
                <div className='col-span-1 ml-20 mt-8 p-8 bg-nique-blue text-white'>
                    <h4 className='text-2xl font-bold text-right mb-4'>Follow Technique</h4>
                    <p className="flex gap-2 justify-end items-center text-white">
                        <a className='hover:text-gray-100' href='https://www.facebook.com/thenique' target='_blank' rel='noopener noreferrer' aria-label='Technique Facebook'><FaFacebook /></a>
                        <a className='hover:text-gray-100' href='https://twitter.com/the_nique' target='_blank' rel='noopener noreferrer' aria-label='Technique X'><FaXTwitter /></a>
                        <a className='hover:text-gray-100' href='https://www.instagram.com/gt_nique' target='_blank' rel='noopener noreferrer' aria-label='Technique Instagram'><FaInstagram /></a>
                        <a className='hover:text-gray-100' href='https://www.tiktok.com/@gt_nique' target='_blank' rel='noopener noreferrer' aria-label='Technique TikTok'><FaTiktok /></a>
                        <a className='hover:text-gray-100' href='https://www.linkedin.com/company/technique-newspaper/' target='_blank' rel='noopener noreferrer' aria-label='Technique LinkedIn'><FaLinkedin /></a>
                    </p>
                </div>
            </div>

            {/* Upcoming Print Schedule */}
            {publications.length > 0 && (
                <div className='max-w-[80%] m-auto p-5'>
                    <h4 className='text-2xl font-bold text-nique-blue my-6'>Upcoming Print Dates</h4>
                    <ul className='list-disc ml-8 text-lg'>
                        {publications.map((pub) => (
                            <li key={pub._id} className='mt-2'>
                                {formatPublicationDate(pub)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Vision */}
            <div className='max-w-[80%] m-auto p-5'>
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
                            <li>Providing coverage and analysis of news and events both on- and off-campus that affect the student body</li>
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
            <div className='max-w-[80%] m-auto p-5'>
                <h4 className='text-2xl font-bold text-nique-blue my-6'>Getting Involved</h4>
                <p className='text-lg mt-5'>
                    Our staff is comprised entirely of Tech students interested 
                    in improving their writing, communication and design skills. If you are interested in any of the following, consider joining the Technique.
                </p>
                    <ul className='text-lg my-3 list-disc ml-8'>
                        <li>
                            <strong>Improving your writing skills:</strong> By joining the Technique, you will learn how to write articles for a range of different 
                            sections including News, Opinions, Life, Entertainment and Sports. In addition, you will learn how to interview sources and improve your skills 
                            in analyzing information and asking the right questions.
                        </li>
                        <li>
                            <strong>Design skills:</strong> The Technique maintains two media of publication — both print and online formats. If you're interested in 
                            graphic design, you'll have the opportunity to work with section editors to help design the paper layout on a weekly basis, which will help you 
                            expand your graphic design portfolio.
                        </li>
                        <li>
                            <strong>Photography:</strong> Our staff is responsible for taking photos for the paper. Lessons on topics such as shooting sports, portraits and 
                            landscapes are taught by fellow students.
                        </li>
                        <li>
                            <strong>Web Development:</strong> The Technique website was completely designed by and is maintained by Tech students. Whether you are interested in frontend, backend, or full-stack development, The Technique offers an opportunity to learn the basics of web development in a low-stakes environment.
                        </li>
                    </ul>

                <p className='text-lg'>
                    General Body Meetings are held weekly during the Fall and Spring semesters on Tuesdays at 7:00 p.m. in the Student Center in room 2150 (Student Media Suite).
                </p>
                <p className='text-lg mt-3'>
                    Our main form of internal communication is on Slack. You can log in to Slack with your Tech credentials  
                    <a href=" https://join.slack.com/t/techniquestaf-lba4588/shared_invite/zt-2p2rgiqtx-95XC_o1P~x2mOLihFDFA~Q" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='text-nique-light-blue hover:text-nique-blue-hover'> <u>here</u> </a> 
                    and search "The Technique" to join the new Slack.
                </p>
            </div>
        </>
    );
}

export default About;
