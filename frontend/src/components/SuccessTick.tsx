const SuccessTick = ( {className}: {className?: string | null} ) => (
    <svg className={`${className || ""} w-5 h-5`} viewBox='0 0 26 26'>
        <circle
            cx='12'
            cy='12'
            r='10'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeDasharray='62.8'
            strokeDashoffset='62.8'
        >
            <animate attributeName='stroke-dashoffset' from='62.8' to='0' dur='0.4s' fill='freeze' />
        </circle>
        <polyline
            points='6 12 10 16 18 8'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeDasharray='24'
            strokeDashoffset='24'
        >
            <animate attributeName='stroke-dashoffset' from='24' to='0' begin='0.2s' dur='0.3s' fill='freeze' />
        </polyline>
    </svg>
);

export default SuccessTick;