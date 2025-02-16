function VerticalAd({ ad }: { ad: string }) {
    return (
        <div className='text-center'>
            <h4 className="text-[#C4C4C4] text-xs uppercase mb-2">Advertisement</h4>
            <img className='rounded-sm w-full max-w-xs m-auto' src={ad} />
        </div>
    )
}

export default VerticalAd