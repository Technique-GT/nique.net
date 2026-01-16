import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function RecentSales() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/articles/campus-news.png' alt='Article' />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>New Library Opening Delayed</p>
            <p className='text-muted-foreground text-sm'>
              Campus News • 1,245 views
            </p>
          </div>
          <div className='font-medium'>3.4 min</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='flex h-9 w-9 items-center justify-center space-y-0 border'>
          <AvatarImage src='/articles/sports.png' alt='Article' />
          <AvatarFallback>SP</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>Basketball Team Wins Championship</p>
            <p className='text-muted-foreground text-sm'>
              Sports • 2,780 views
            </p>
          </div>
          <div className='font-medium'>5.1 min</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/articles/opinion.png' alt='Article' />
          <AvatarFallback>OP</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>Why We Need More Study Spaces</p>
            <p className='text-muted-foreground text-sm'>
              Opinion • 890 views
            </p>
          </div>
          <div className='font-medium'>4.2 min</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/articles/features.png' alt='Article' />
          <AvatarFallback>FT</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>Student Startup Success Stories</p>
            <p className='text-muted-foreground text-sm'>
              Features • 1,560 views
            </p>
          </div>
          <div className='font-medium'>7.8 min</div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9'>
          <AvatarImage src='/articles/arts.png' alt='Article' />
          <AvatarFallback>AR</AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>Spring Theater Productions Announced</p>
            <p className='text-muted-foreground text-sm'>
              Arts • 1,020 views
            </p>
          </div>
          <div className='font-medium'>3.9 min</div>
        </div>
      </div>
    </div>
  )
}