import { useEffect, useMemo, useState, type UIEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getMediaImages } from '@/services/media'

const PAGE_SIZE = 21
const SEARCH_DEBOUNCE_MS = 350
const SCROLL_THRESHOLD_PX = 220
const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 15 * 60 * 1000
const FIRST_ROW_EAGER_COUNT = 3
const SKELETON_TILE_COUNT = 6

type MediaPickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  disabled?: boolean
}

export function MediaPickerSheet({
  open,
  onOpenChange,
  onSelect,
  disabled = false,
}: MediaPickerSheetProps) {
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoPaginationTriggered, setAutoPaginationTriggered] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase())
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setAutoPaginationTriggered(false)
  }, [searchQuery, open])

  const query = useInfiniteQuery({
    queryKey: ['media-picker-images', PAGE_SIZE, searchQuery],
    queryFn: ({ pageParam }) =>
      getMediaImages({
        cursor: pageParam,
        limit: PAGE_SIZE,
        q: searchQuery,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: open && !disabled,
  })

  const images = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  )

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!query.hasNextPage || query.isFetchingNextPage) return

    const target = event.currentTarget
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight

    if (distanceToBottom <= SCROLL_THRESHOLD_PX) {
      setAutoPaginationTriggered(true)
      void query.fetchNextPage()
    }
  }

  const isInitialLoading = query.isLoading && images.length === 0
  const showLoadMoreFallback =
    !!query.hasNextPage &&
    !autoPaginationTriggered &&
    !query.isFetchingNextPage &&
    images.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-2xl gap-0'>
        <SheetHeader className='pr-10'>
          <SheetTitle>Media Picker</SheetTitle>
        </SheetHeader>

        <div className='flex h-full min-h-0 flex-col gap-3 px-4 pb-4'>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder='Search by filename...'
            disabled={disabled}
          />

          <div
            className='min-h-0 flex-1 overflow-y-auto rounded-md'
            onScroll={handleScroll}
          >
            {isInitialLoading ? (
              <div className='grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: SKELETON_TILE_COUNT }, (_, idx) => `skeleton-${idx}`).map((skeletonKey) => (
                  <div
                    key={skeletonKey}
                    className='overflow-hidden rounded-md border'
                  >
                    <div className='aspect-video animate-pulse bg-muted/50' />
                    <div className='space-y-2 p-2'>
                      <div className='h-3 w-3/4 animate-pulse rounded bg-muted/50' />
                      <div className='h-3 w-1/2 animate-pulse rounded bg-muted/50' />
                    </div>
                  </div>
                ))}
              </div>
            ) : query.isError ? (
              <div className='flex h-44 flex-col items-center justify-center gap-3 px-4 text-center'>
                <p className='text-sm text-muted-foreground'>
                  Failed to load images.
                </p>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => query.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : images.length === 0 ? (
              <div className='flex h-44 items-center justify-center px-4 text-sm text-muted-foreground'>
                No images found.
              </div>
            ) : (
              <div className='space-y-3 p-3'>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {images.map((image, index) => {
                    const fileName = image.fileName || image.key.split('/').pop() || image.key
                    return (
                      <button
                        key={image._id}
                        type='button'
                        onClick={() => onSelect(image.url)}
                        className={cn(
                          'overflow-hidden rounded-md border text-left transition-colors',
                          'hover:border-primary focus-visible:border-primary focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                        )}
                      >
                        <div className='aspect-video overflow-hidden bg-muted/30'>
                          <img
                            src={image.url}
                            alt={fileName}
                            className='h-full w-full object-cover'
                            width={640}
                            height={360}
                            loading={index < FIRST_ROW_EAGER_COUNT ? 'eager' : 'lazy'}
                            decoding='async'
                          />
                        </div>
                        <div className='flex items-center gap-2 p-2'>
                          <ImageIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
                          <p className='truncate text-xs font-medium'>{fileName}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {query.isFetchingNextPage && (
                  <div className='flex items-center justify-center py-2 text-sm text-muted-foreground'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Loading more...
                  </div>
                )}

                {showLoadMoreFallback && (
                  <div className='flex justify-center pt-1'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => void query.fetchNextPage()}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
