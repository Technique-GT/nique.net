import { useNavigate } from 'react-router-dom'
import { ArticleProps } from '../types/article'
import { getArticleLink } from '../utils/articlePresentation'

function formatTimeSincePublished(publishedAt?: string | Date | null) {
    if (!publishedAt) {
        return '';
    }

    const published = new Date(publishedAt);
    if (Number.isNaN(published.getTime())) {
        return '';
    }

    const diff = Date.now() - published.getTime();
    if (diff < 1000) {
        return 'just now';
    }

    const units = [
        { label: 'day', milliseconds: 24 * 60 * 60 * 1000 },
        { label: 'hour', milliseconds: 60 * 60 * 1000 },
        { label: 'minute', milliseconds: 60 * 1000 },
        { label: 'second', milliseconds: 1000 },
    ];

    for (const unit of units) {
        if (diff >= unit.milliseconds) {
            const value = Math.floor(diff / unit.milliseconds);
            const suffix = value === 1 ? unit.label : `${unit.label}s`;
            return `${value} ${suffix} ago`;
        }
    }

    return 'just now';
}

function JustInBlock({ article }: ArticleProps) {
    const navigate = useNavigate();
    const link = getArticleLink(article);
    
    if (article.publishedAt) {
        const publishedDate = new Date(article.publishedAt);
        if (!Number.isNaN(publishedDate.getTime())) {
            const diffInMilliseconds = Date.now() - publishedDate.getTime();
            const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;

            // If article is older than 5 days, render nothing
            if (diffInMilliseconds > fiveDaysInMilliseconds) {
                return null;
            }
        }
    }

    return (
        <div className='flex flex-col sm:flex-row gap-4 content-center cursor-pointer' onClick={() => navigate(link)}>
            <button className='bg-[#1A1E47] m-auto sm:m-0 rounded-md text-white h-[42px] lg:h-full w-[94px] p-2 cursor-pointer' onClick={() => navigate(link)}><h4 className='font-bold uppercase text-xl'>Just In</h4></button>
            <div>
                <h3 className="title text-center sm:text-left text-black font-bold text-2xl/5 mb-1">{article.title}</h3>
                <h6 className="text-center sm:text-left text-[#BAC0FF] text-sm">{formatTimeSincePublished(article.publishedAt)}</h6>
            </div>
        </div>
    )
}

export default JustInBlock
