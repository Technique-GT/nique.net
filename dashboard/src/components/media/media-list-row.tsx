import { Copy, ExternalLink, ImageIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import type { MediaImage } from '@/services/media'

type MediaListRowProps = {
  image: MediaImage
  selected: boolean
  onSelect: (key: string) => void
  onCopy: (url: string) => void | Promise<void>
  onOpen: (url: string) => void
  onDelete?: (image: MediaImage) => void
  formatBytes: (bytes: number) => string
  formatDate: (input?: string) => string
}

export function MediaListRow({
  image,
  selected,
  onSelect,
  onCopy,
  onOpen,
  onDelete,
  formatBytes,
  formatDate,
}: MediaListRowProps) {
  return (
    <TableRow
      className={selected ? 'bg-muted/40' : ''}
      onClick={() => onSelect(image.key)}
    >
      <TableCell>
        <img
          src={image.url}
          alt={image.key}
          className='h-10 w-12 rounded-md border object-cover sm:h-12 sm:w-16'
          loading='lazy'
        />
      </TableCell>
      <TableCell>
        <div className='flex items-start gap-2'>
          <ImageIcon className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{image.key.split('/').pop() || image.key}</p>
            <p className='truncate text-xs text-muted-foreground'>{image.key}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className='hidden sm:table-cell'>
        <Badge variant='secondary'>{formatBytes(image.size)}</Badge>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <span className='text-sm text-muted-foreground'>
          {formatDate(image.lastModified || image.uploadedAt)}
        </span>
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2'>
          <Button
            type='button'
            size='sm'
            className='w-full sm:w-auto'
            onClick={(e) => {
              e.stopPropagation()
              void onCopy(image.url)
            }}
          >
            <Copy className='mr-2 h-4 w-4' />
            Copy URL
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='w-full sm:w-auto'
            onClick={(e) => {
              e.stopPropagation()
              onOpen(image.url)
            }}
          >
            <ExternalLink className='h-4 w-4' />
          </Button>
          {onDelete && (
            <Button
              type='button'
              size='sm'
              variant='destructive'
              className='w-full sm:w-auto'
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image)
              }}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
