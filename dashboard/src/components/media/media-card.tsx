import { Copy, ExternalLink, ImageIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { MediaImage } from '@/services/media'

type MediaCardProps = {
  image: MediaImage
  selected: boolean
  onSelect: (key: string) => void
  onCopy: (url: string) => void | Promise<void>
  onOpen: (url: string) => void
  onDelete?: (image: MediaImage) => void
  formatBytes: (bytes: number) => string
  formatDate: (input?: string) => string
}

export function MediaCard({
  image,
  selected,
  onSelect,
  onCopy,
  onOpen,
  onDelete,
  formatBytes,
  formatDate,
}: MediaCardProps) {
  const fileName = image.key.split('/').pop() || image.key

  return (
    <Card className={`overflow-hidden gap-0 py-0 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <button
        type='button'
        className='group/media relative block w-full overflow-hidden text-left'
        onClick={() => onSelect(image.key)}
      >
        <img
          src={image.url}
          alt={image.key}
          className='h-64 w-full object-cover transition-transform duration-300 group-hover/media:scale-[1.03]'
          loading='lazy'
        />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/45 to-transparent opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 group-focus/media:opacity-100' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 text-white opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 group-focus/media:opacity-100'>
          <ImageIcon className='h-4 w-4 shrink-0' />
          <span className='truncate text-sm font-semibold'>{fileName}</span>
        </div>
      </button>
      <CardContent className='space-y-2 px-4 pt-4'>
        <p className='line-clamp-2 break-all text-xs text-muted-foreground'>{image.key}</p>
        <div className='flex flex-wrap gap-2 text-xs'>
          <Badge variant='secondary'>{formatBytes(image.size)}</Badge>
          <Badge variant='secondary'>{formatDate(image.lastModified || image.uploadedAt)}</Badge>
        </div>
      </CardContent>
      <CardFooter className='flex gap-2 px-4 pb-4 pt-3'>
        <Button type='button' size='sm' onClick={() => void onCopy(image.url)}>
          <Copy className='mr-2 h-4 w-4' />
          Copy URL
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={() => onOpen(image.url)}>
          <ExternalLink className='h-4 w-4' />
        </Button>
        {onDelete && (
          <Button
            type='button'
            size='sm'
            variant='destructive'
            onClick={() => onDelete(image)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
