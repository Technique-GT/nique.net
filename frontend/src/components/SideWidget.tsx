import { FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import VerticalAd from "./VerticalAd";
import MockAd from '../assets/mock_advertisement.jpg';
import PrintIssues from '../assets/print_issues.png';
import { Categories } from "../types/categories";
import { createSliver } from "../services/sliverService";
import { createStory } from "../services/storyService";
import SuccessTick from "./SuccessTick";


function SideWidget() {
    const [text, setText] = useState('');
    const [isSliverSubmitting, setIsSliverSubmitting] = useState(false);
    const [sliverSubmitted, setSliverSubmitted] = useState<'idle' | 'success' | 'error'>('idle');
    const [storyModalActive, setStoryModalActive] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [storyInput, setStoryInput] = useState('');
    const [storyStatus, setStoryStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isStorySubmitting, setIsStorySubmitting] = useState(false);
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

    const onStorySubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (storyResetTimeout.current) {
            clearTimeout(storyResetTimeout.current);
            storyResetTimeout.current = null;
        }

        const _title = titleInput.trim();
        const _text = storyInput.trim();
        if (!_title || !_text) {
            return;
        }

        setIsStorySubmitting(true);
        setStoryStatus('idle');

        try {
            await createStory(_title, _text);
            setTitleInput('');
            setStoryInput('');
            setStoryStatus('success');
            storyResetTimeout.current = window.setTimeout(() => {
                // setStoryModalActive(false);
                setStoryStatus('idle');
            }, 1200);
        } catch (error) {
            // console.error('Failed to submit story', error);
            setStoryStatus('error');
        } finally {
            setIsStorySubmitting(false);
        }
    };

    return (
        <div className='text-nique-blue'>
            <h4 className="font-bold mb-1 text-xl">Next Print: Nov 1, The Politics Issue</h4>
            <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'><h4>Fall Schedule</h4></button>

            <hr className='my-3 border-nique-blue' />

            <h4 className="font-bold mb-1 text-xl">Sliver : Your Thoughts</h4>
            <textarea maxLength={500} className={`h-[60px] w-full border-solid border-1 border-nique-blue rounded-md px-2 py-1 ${sliverSubmitted === 'error' ? 'border-red-600' : ''}`} value={text} onChange={handleChange}></textarea>
            {sliverSubmitted === 'error' && <h4 className='text-sm text-red-600'>Something went wrong 🤔</h4>}
            <div className='flex justify-between'>
                <h6>{500 - wordCount}</h6>
                <button
                    className={`bg-nique-blue hover:bg-nique-blue-hover text-white rounded-sm px-4 py-1 ${text.trim().length === 0 ? 'cursor-not-allowed' : ''}`}
                    onClick={onSliverSubmit}
                    disabled={text.trim().length === 0}
                >
                    {isSliverSubmitting && <h4 className='text-sm'>Submitting...</h4>}
                    {(sliverSubmitted === 'idle' || sliverSubmitted === 'error') && <h4 className='text-sm'>Submit Sliver</h4>}
                    {sliverSubmitted === 'success' && <h4 className='text-sm'><SuccessTick /></h4>}
                </button>
            </div>
            <h4 className='text-black text-xs mt-2'>The Sliver Box is a way to quickly share vents, thoughts on campus happenings, and more! See your words in print in the News section of every issue.</h4>

            <hr className='my-3 border-nique-blue' />

            <h4 className="font-bold mb-1 text-xl">Got News?</h4>
            <h4 className='text-black text-xs mt-1 mb-3'>Do you have any ideas for our reporters or editors? Do you want to give new news about your organization or business? Tell us!</h4>
            { 
                storyModalActive ?
                (<form onSubmit={onStorySubmit}>
                    <textarea className={`w-full h-8 px-2 py-1 border border-nique-blue rounded-md ${storyStatus === 'error' ? 'border-red-600' : ''}`} placeholder="Subject" value={titleInput} onChange={(e) => {
                        setTitleInput(e.target.value);
                        if (storyStatus !== 'idle') {
                            setStoryStatus('idle');
                        }
                    }}></textarea>
                    <textarea className={`w-full h-64 px-2 py-1 border border-nique-blue rounded-md ${storyStatus === 'error' ? 'border-red-600' : ''}`} placeholder="What's your story?" value={storyInput} onChange={(e) => {
                        setStoryInput(e.target.value);
                        if (storyStatus !== 'idle') {
                            setStoryStatus('idle');
                        }
                    }}></textarea>
                    {!isStorySubmitting && storyStatus === 'error' && <h4 className='text-sm text-red-600'>Something went wrong 🤔</h4>}
                    <button 
                        type="submit" 
                        className={`bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1 mt-2 flex items-center justify-center gap-2 ${isStorySubmitting || titleInput.trim().length === 0 || storyInput.trim().length === 0 ? 'cursor-not-allowed' : ''}`}
                        disabled={isStorySubmitting || titleInput.trim().length === 0 || storyInput.trim().length === 0}
                    >
                        {isStorySubmitting && <h4 className='text-sm'>Submitting...</h4>}
                        {!isStorySubmitting && (storyStatus === 'idle' || storyStatus === 'error') && <h4 className='text-sm'>Submit</h4>}
                        {!isStorySubmitting && storyStatus === 'success' && <SuccessTick />}
                    </button>
                </form>) :
                (<button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1' onClick={() => {
                    setStoryModalActive(true);
                    setStoryStatus('idle');
                }}>
                    <h4>Submit a Story</h4>
                </button>)
            }

            <hr className='my-3 border-nique-blue' />

            <VerticalAd ad={MockAd} />

            <hr className='my-3 border-nique-blue' />

            <div className='flex gap-6 items-center w-full max-w-lg m-auto'>
                <img className='w-[60%] mt-3 mb-2' src={PrintIssues} />
                <div>
                    <h4 className="font-bold mb-1 text-xl">Latest Print Issue</h4>
                    <h4 className='text-black text-xs mt-1 mb-3'>Check out the digital editions of our printed paper!</h4>
                    <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'><h4>Read Now</h4></button>
                </div>
            </div>

            <hr className='my-3 border-nique-blue' />

            <h4 className="font-bold mb-1 text-2xl">{Categories.OPINION}</h4>
        </div>
    )
}

export default SideWidget
