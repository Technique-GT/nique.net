import { useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, LayoutGrid, List, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { MediaCard } from '@/components/media/media-card'
import { MediaListRow } from '@/components/media/media-list-row'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/stores/authStore'
import { deleteMedia, getMediaImages, getMediaUsage, type MediaImage, type MediaUsageArticle } from '@/services/media'

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 350
const USAGE_PAGE_LIMIT = 10

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** idx
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

function formatDate(input?: string): string {
  if (!input) return 'Unknown date'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value)
  toast.success('URL copied to clipboard.')
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function MediaLibrary() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore((state) => state.auth)
  const canDeleteMedia = !!user?.isAdmin

  const [viewMode, setViewMode] = useState<'gallery' | 'detail'>('gallery')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'size'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null)
  const [usageArticles, setUsageArticles] = useState<MediaUsageArticle[]>([])
  const [usagePagination, setUsagePagination] = useState<{
    total: number
    page: number
    pages: number
    limit: number
  } | null>(null)
  const [usagePage, setUsagePage] = useState(1)
  const [usageLoading, setUsageLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const query = useInfiniteQuery({
    queryKey: ['media-images', PAGE_SIZE, searchQuery, sortBy, sortDir, refreshNonce],
    queryFn: ({ pageParam }) =>
      getMediaImages({
        cursor: pageParam,
        limit: PAGE_SIZE,
        refresh: !pageParam && refreshNonce > 0,
        q: searchQuery,
        sortBy,
        sortDir,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    staleTime: 15 * 1000,
  })

  const images = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data?.pages],
  )

  useEffect(() => {
    if (!selectedKey && images.length > 0) {
      setSelectedKey(images[0].key)
      return
    }
    if (selectedKey && !images.some((image) => image.key === selectedKey)) {
      setSelectedKey(images[0]?.key ?? null)
    }
  }, [images, selectedKey])

  useEffect(() => {
    if (!deleteDialogOpen || !deleteTarget) return

    const fetchUsage = async () => {
      setUsageLoading(true)
      try {
        const response = await getMediaUsage(deleteTarget._id, {
          page: usagePage,
          limit: USAGE_PAGE_LIMIT,
        })
        setUsagePagination(response.pagination)
        setUsageArticles((prev) => {
          if (usagePage === 1) return response.data
          const existing = new Set(prev.map((article) => article._id))
          const next = response.data.filter((article) => !existing.has(article._id))
          return [...prev, ...next]
        })
      } catch (error) {
        toast.error('Failed to load article usage for this image')
      } finally {
        setUsageLoading(false)
      }
    }

    void fetchUsage()
  }, [deleteDialogOpen, deleteTarget, usagePage])

  const openDeleteDialog = (image: MediaImage) => {
    setDeleteTarget(image)
    setUsageArticles([])
    setUsagePagination(null)
    setUsagePage(1)
    setDeleteDialogOpen(true)
  }

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setDeleteTarget(null)
      setUsageArticles([])
      setUsagePagination(null)
      setUsagePage(1)
      setUsageLoading(false)
      setDeleteLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setDeleteLoading(true)
    try {
      await deleteMedia(deleteTarget._id, { confirmInUse: true })
      toast.success('Image deleted successfully')
      handleDeleteDialogChange(false)
      await queryClient.invalidateQueries({ queryKey: ['media-images'] })
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        const body = error.response.data as {
          data?: MediaUsageArticle[]
          pagination?: { total: number; page: number; pages: number; limit: number }
        }
        setUsageArticles(Array.isArray(body?.data) ? body.data : [])
        setUsagePagination(body?.pagination ?? null)
        setUsagePage(1)
        toast.error('Image is currently used by articles. Review references and confirm again.')
      } else {
        toast.error('Failed to delete image')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const isInitialLoading = query.isLoading && images.length === 0

  return (
    <Main>
      <PageHeader
        title='Media Library'
        description='Browse images stored in media.nique.net'
        actions={
          <div className='flex w-full flex-col gap-2 md:items-end'>
            <div className='flex w-full flex-col gap-2 sm:flex-row md:w-auto'>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Search by filename...'
                className='w-full sm:w-60'
              />
              <Select value={sortBy} onValueChange={(value: 'date' | 'size') => setSortBy(value)}>
                <SelectTrigger className='w-full sm:w-35'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='date'>Date</SelectItem>
                  <SelectItem value='size'>File size</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              >
                <ArrowUpDown className='mr-2 h-4 w-4' />
                {sortDir === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant={viewMode === 'gallery' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('gallery')}
              >
                <LayoutGrid className='mr-2 h-4 w-4' />
                Gallery
              </Button>
              <Button
                type='button'
                variant={viewMode === 'detail' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('detail')}
              >
                <List className='mr-2 h-4 w-4' />
                Detail
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setRefreshNonce((v) => v + 1)}
                disabled={query.isFetching}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        }
      />

      {isInitialLoading ? (
        <Card>
          <CardContent className='flex h-44 items-center justify-center'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Loader2 className='h-5 w-5 animate-spin' />
              Loading images...
            </div>
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardContent className='flex h-44 flex-col items-center justify-center gap-3 text-center'>
            <p className='text-sm text-muted-foreground'>Failed to load images from R2.</p>
            <Button type='button' variant='outline' onClick={() => query.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className='flex h-44 items-center justify-center text-muted-foreground'>
            No images found.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>{images.length} loaded</span>
          </div>

          {viewMode === 'gallery' ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {images.map((image) => (
                <MediaCard
                  key={image.key}
                  image={image}
                  selected={selectedKey === image.key}
                  onSelect={setSelectedKey}
                  onCopy={copyToClipboard}
                  onOpen={openInNewTab}
                  onDelete={canDeleteMedia ? openDeleteDialog : undefined}
                  formatBytes={formatBytes}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-18 sm:w-23'>File</TableHead>
                        <TableHead></TableHead>
                        <TableHead className='hidden sm:table-cell sm:w-24 md:w-27.5'>Size</TableHead>
                        <TableHead className='hidden md:table-cell md:w-47.5 lg:w-55'>Uploaded</TableHead>
                        <TableHead className='w-33 sm:w-45 md:w-55'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map((image) => (
                        <MediaListRow
                          key={image.key}
                          image={image}
                          selected={selectedKey === image.key}
                          onSelect={setSelectedKey}
                          onCopy={copyToClipboard}
                          onOpen={openInNewTab}
                          onDelete={canDeleteMedia ? openDeleteDialog : undefined}
                          formatBytes={formatBytes}
                          formatDate={formatDate}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className='flex justify-center'>
            {query.hasNextPage ? (
              <Button type='button' variant='outline' onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Loading more
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            ) : (
              <p className='text-xs text-muted-foreground'>No more images.</p>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader className='text-left'>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-3'>
                <p>
                  This will permanently delete this image from Cloudflare R2:
                  <span className='mt-1 block break-all font-mono text-xs text-foreground'>
                    {deleteTarget?.key}
                  </span>
                </p>

                {usageLoading ? (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Checking article usage...
                  </div>
                ) : usageArticles.length > 0 ? (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-destructive'>
                      This image is currently referenced by {usagePagination?.total ?? usageArticles.length} article(s).
                    </p>
                    <div className='max-h-56 space-y-2 overflow-y-auto rounded-md border p-2'>
                      {usageArticles.map((article) => (
                        <div key={article._id} className='rounded-md border p-2'>
                          <p className='text-sm font-medium'>{article.title}</p>
                          <p className='text-xs text-muted-foreground'>/{article.slug}</p>
                          <div className='mt-2 flex flex-wrap gap-2'>
                            <Badge variant={article.published ? 'default' : 'secondary'}>
                              {article.published ? 'Published' : 'Unpublished'}
                            </Badge>
                            {article.reviewStatus && (
                              <Badge variant='outline'>{article.reviewStatus}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {usagePagination && usagePage < usagePagination.pages && (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => setUsagePage((prev) => prev + 1)}
                        disabled={usageLoading}
                      >
                        Load more references
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No articles currently reference this image.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button
              type='button'
              variant='destructive'
              onClick={() => void handleConfirmDelete()}
              disabled={deleteLoading || !deleteTarget}
            >
              {deleteLoading ? 'Deleting...' : 'Delete image'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}
