import Navbar from './Navbar';
import { Categories } from '../types/categories';

// Stand-in for a single ArticleBlock. Mirrors ArticleBlock's rounded corners
// and height contract so the placeholder grid lines up with the real one.
function BlockPlaceholder({ height, className = '' }: { height?: string; className?: string }) {
    return (
        <div
            className={`w-full rounded-md bg-gray-200 max-h-[50vh] md:max-h-none motion-safe:animate-pulse ${className}`}
            style={height ? { height } : undefined}
        />
    );
}

// Category headings are static text on Home, so render the real ones here.
function CategoryHeading({ name }: { name: string }) {
    return <h4 className="font-bold mb-2 text-2xl text-nique-blue">{name}</h4>;
}

/**
 * Placeholder screen shown while the landing page loads. It mirrors Home's
 * grid so the layout is already in place when the articles arrive, rather than
 * the whole page snapping in from a centered spinner.
 */
function HomeSkeleton() {
    return (
        <>
            <Navbar />
            <div
                role="status"
                aria-busy="true"
                aria-label="Loading articles"
                className='max-w-[95%] md:max-w-[80%] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_30%] lg:grid-cols-[auto_25%] gap-5'
            >
                <div className='w-full'>
                    {/* Main */}
                    <div className='grid gap-5 grid-cols-1 lg:grid-cols-[30%_auto] lg:grid-rows-4 w-full h-[80vh]'>
                        <div className='flex flex-col gap-4 order-last lg:order-first lg:row-span-4'>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <BlockPlaceholder key={index} className='flex-1' />
                            ))}
                        </div>
                        <div className='flex flex-col gap-4 row-span-4 h-full'>
                            <BlockPlaceholder className='flex-1' />
                            <BlockPlaceholder className='flex-1' />
                        </div>
                    </div>

                    <hr className='my-3' />

                    {/* Categories */}
                    <CategoryHeading name={Categories.LIFE} />
                    <div className='grid grid-cols-2 md:grid-cols-[48%_auto] gap-4'>
                        <div className='w-full'>
                            <BlockPlaceholder height='396px' />
                        </div>
                        <div className='flex flex-col gap-4 w-full'>
                            <BlockPlaceholder height='190px' />
                            <BlockPlaceholder height='190px' />
                        </div>
                    </div>

                    <hr className='my-3' />

                    <CategoryHeading name={Categories.NEWS} />
                    <div className='grid grid-cols-3 sm:flex-row gap-4'>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <BlockPlaceholder key={index} height='200px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <CategoryHeading name={Categories.ENTERTAINMENT} />
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <BlockPlaceholder key={index} height='230px' />
                        ))}
                    </div>

                    <hr className='my-3' />

                    <CategoryHeading name={Categories.SPORTS} />
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-4'>
                        <div className='sm:col-span-2'>
                            <BlockPlaceholder height='396px' />
                        </div>
                        <div className='sm:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-2'>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <BlockPlaceholder key={index} height='190px' />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className='flex flex-col gap-4'>
                    <BlockPlaceholder height='420px' />
                    <div className='flex flex-col gap-4'>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <BlockPlaceholder key={index} height='90px' />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomeSkeleton;
