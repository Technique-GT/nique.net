import { SetStateAction, useEffect, useRef, useState } from "react";
// import VerticalAd from "./VerticalAd";
// import MockAd from '../assets/mock_advertisement.jpg';
import PrintIssues from '../assets/print_issues.png';
import { Categories } from "../types/categories";
import { createSliver } from "../services/sliverService";
import SuccessTick from "./SuccessTick";


function SideWidget() {
    const [text, setText] = useState('');
    const [isSliverSubmitting, setIsSliverSubmitting] = useState(false);
    const [sliverSubmitted, setSliverSubmitted] = useState<'idle' | 'success' | 'error'>('idle');
    const wordCount = text.length;
    const sliverResetTimeout = useRef<number | null>(null);
    const storyResetTimeout = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (storyResetTimeout.current) {
                clearTimeout(storyResetTimeout.current);
            }
        };
    }, []);

    const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
        setText(event.target.value);
        if (sliverSubmitted !== 'idle') {
            setSliverSubmitted('idle');
        }
    };

    const onSliverSubmit = async () => {
        const trimmedText = text.trim();
        if (!trimmedText) {
            return;
        }

        if (sliverResetTimeout.current) {
            clearTimeout(sliverResetTimeout.current);
            sliverResetTimeout.current = null;
        }

        setIsSliverSubmitting(true);
        setSliverSubmitted('idle');

        try {
            await createSliver(trimmedText);
            setSliverSubmitted('success');
            setText('');
            sliverResetTimeout.current = window.setTimeout(() => {
                // setStoryModalActive(false);
                setSliverSubmitted('idle');
            }, 1200);
        } catch (error) {
            // console.error('Failed to submit sliver', error);
            setSliverSubmitted('error');
        } finally {
            setIsSliverSubmitting(false);
        }
    };

    return (
        <div className='text-nique-blue'>
            {/* <h4 className="font-bold mb-1 text-xl">Next Print: Nov 1, The Politics Issue</h4>
            <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'><h4>Fall Schedule</h4></button>

            <hr className='my-3' /> */}

            <h4 className="font-bold mb-1 text-xl">Sliver : Your Thoughts</h4>
            <textarea maxLength={500} className={`h-15 w-full border-solid border border-nique-blue rounded-md px-2 py-1 ${sliverSubmitted === 'error' ? 'border-red-600' : ''}`} value={text} onChange={handleChange}></textarea>
            {sliverSubmitted === 'error' && <h4 className='text-sm text-red-600'>Something went wrong 🤔</h4>}
            <div className='flex justify-between'>
                <h6>{500 - wordCount}</h6>
                <button
                    className={`bg-nique-blue hover:bg-nique-blue-hover text-white rounded-sm px-4 py-1 ${text.trim().length === 0 ? 'cursor-not-allowed' : ''}`}
                    onClick={onSliverSubmit}
                    disabled={text.trim().length === 0}
                >
                    {isSliverSubmitting && <h4 className='text-sm'>Submitting...</h4>}
                    {!isSliverSubmitting && (sliverSubmitted === 'idle' || sliverSubmitted === 'error') && <h4 className='text-sm'>Submit Sliver</h4>}
                    {sliverSubmitted === 'success' && <h4 className='text-sm'><SuccessTick className='text-white'/></h4>}
                </button>
            </div>
            <h4 className='text-black text-xs mt-2'>The Sliver Box is a way to quickly share vents, thoughts on campus happenings, and more! See your words in print in the News section of every issue.</h4>

            <hr className='my-3' />

            <h4 className="font-bold mb-1 text-xl">Got News?</h4>
            <h4 className='text-black text-xs mt-1 mb-3'>Do you have any ideas for our reporters or editors? Do you want to give new news about your organization or business? Tell us at editor@nique.net!</h4>
            <button
                type='button'
                className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'
                onClick={(event) => {
                    event.preventDefault();
                    window.location.href = 'mailto:editor@nique.net';
                }}>
                <h4>Submit a Story</h4>
            </button>

            <hr className='my-3' />

            {/* <VerticalAd ad={MockAd} />

            <hr className='my-3' /> */}

            <div className='flex gap-6 items-center w-full max-w-lg m-auto'>
                <img className='w-[60%] mt-3 mb-2' src={PrintIssues} />
                <div>
                    <h4 className="font-bold mb-1 text-xl">Latest Print Issue</h4>
                    <h4 className='text-black text-xs mt-1 mb-3'>Check out the digital editions of our printed paper!</h4>
                    <button 
                        className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'
                        onClick={() => window.open('https://www.scribd.com/user/198757487/The-Technique', '_blank')}
                    >
                            <h4>Read Now</h4>
                    </button>
                </div>
            </div>

            <hr className='my-3' />

            <h4 className="font-bold mb-1 text-2xl">{Categories.OPINION}</h4>
        </div>
    )
}

export default SideWidget
