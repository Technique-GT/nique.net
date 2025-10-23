import { SetStateAction, useState } from "react";
import VerticalAd from "./VerticalAd";
import MockAd from '../assets/mock_advertisement.jpg';
import PrintIssues from '../assets/print_issues.png';
import { Categories } from "../types/categories";
import { createSliver } from "../services/sliverService";

function SideWidget() {
    const [text, setText] = useState('');
    const [sliverSubmitted, setSliverSubmitted] = useState<'idle' | 'success' | 'error'>('idle');
    const [storyModalActive, setStoryModalActive] = useState(false);
    const wordCount = text.length;

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

        try {
            await createSliver(trimmedText);
            setSliverSubmitted('success');
            setText('');
        } catch (error) {
            // console.error('Failed to submit sliver', error);
            setSliverSubmitted('error');
        }
    };

    return (
        <div className='text-nique-blue'>
            <h4 className="font-bold mb-1 text-xl">Next Print: Nov 1, The Politics Issue</h4>
            <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1'><h4>Fall Schedule</h4></button>

            <hr className='my-3 border-nique-blue' />

            <h4 className="font-bold mb-1 text-xl">Sliver : Your Thoughts</h4>
            <textarea maxLength={500} className='h-[60px] w-full border-solid border-1 border-nique-blue rounded-md px-2 py-1' value={text} onChange={handleChange}></textarea>
            <div className='flex justify-between'>
                <h6>{500 - wordCount}</h6>
                <button
                    className={`bg-nique-blue hover:bg-nique-blue-hover text-white rounded-sm px-4 py-1 ${text.trim().length === 0 ? 'cursor-not-allowed' : ''}`}
                    onClick={onSliverSubmit}
                    disabled={text.trim().length === 0}
                >
                    {
                        sliverSubmitted === 'idle' && <h4 className='text-sm'>Submit Sliver</h4>
                    }
                    {
                        sliverSubmitted === 'success' && <h4 className='text-sm'>Thanks!</h4>
                    }
                    {
                        sliverSubmitted === 'error' && <h4 className='text-sm'>Something went wrong :(</h4>
                    }
                </button>
            </div>
            <h4 className='text-black text-xs mt-2'>The Sliver Box is a way to quickly share vents, thoughts on campus happenings, and more! See your words in print in the News section of every issue.</h4>

            <hr className='my-3 border-nique-blue' />

            <h4 className="font-bold mb-1 text-xl">Got News?</h4>
            <h4 className='text-black text-xs mt-1 mb-3'>Do you have any ideas for our reporters or editors? Do you want to give new news about your organization or business? Tell us!</h4>
            { 
                storyModalActive ?
                (<form>
                    <textarea className='w-full h-8 px-2 py-1 border border-nique-blue rounded-md' placeholder="Title"></textarea>
                    <textarea className='w-full h-64 px-2 py-1 border border-nique-blue rounded-md' placeholder="What's your story?"></textarea>
                    <button type="submit" className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1 mt-2'>
                        <h4>Submit</h4>
                    </button>
                </form>) :
                (<button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white w-full p-1' onClick={() => setStoryModalActive(true)}>
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
