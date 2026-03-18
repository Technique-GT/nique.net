import { Copy, ExternalLink, ImageIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
  return (
    <Card className={selected ? 'ring-2 ring-primary' : ''}>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <ImageIcon className='h-4 w-4' />
          <span className='truncate text-ellipsis'>{image.key.split('/').pop() || image.key}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <button
          type='button'
          className='w-full'
          onClick={() => onSelect(image.key)}
        >
          <img
            src={image.url}
            alt={image.key}
            className='h-44 w-full rounded-md border object-cover transition-opacity hover:opacity-90'
            loading='lazy'
          />
        </button>
        <p className='line-clamp-2 break-all text-xs text-muted-foreground'>{image.key}</p>
        <div className='flex flex-wrap gap-2 text-xs'>
          <Badge variant='secondary'>{formatBytes(image.size)}</Badge>
          <Badge variant='secondary'>{formatDate(image.lastModified || image.uploadedAt)}</Badge>
        </div>
      </CardContent>
      <CardFooter className='flex gap-2'>
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
