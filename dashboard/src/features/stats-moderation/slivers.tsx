import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, Search, Trash2 } from 'lucide-react'
import { useDeleteSliver, useSlivers } from '@/hooks/use-queries'

export default function SliversManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const query = useMemo(() => {
    const params: any = { page, limit }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    return params
  }, [page, limit, searchTerm])

  const { data: sliversData, isLoading, refetch } = useSlivers(query)
  const deleteSliverMutation = useDeleteSliver()

  const slivers = sliversData?.data ?? []
  const pagination = sliversData?.pagination
  const pageCount = Math.max(pagination?.pages ?? 1, 1)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, limit])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (Number.isNaN(date.valueOf())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sliver? This cannot be undone.')) return
    try {
      await deleteSliverMutation.mutateAsync(id)
      toast.success('Sliver deleted')
    } catch (error) {
      console.error('Error deleting sliver:', error)
      toast.error('Failed to delete sliver')
    }
  }

  return (
    <Main>
      <PageHeader
        title='Slivers'
        description='Manage user-submitted slivers here. What are readers saying?'
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle>Manage Slivers</CardTitle>
            <div className='text-sm text-muted-foreground'>
              Total: {pagination?.total ?? slivers.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='relative flex-1'>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder='Search sliver text...'
                  className='pl-10'
                />
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              </div>
              <Select value={`${limit}`} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger className='w-full sm:w-28'>
                  <SelectValue placeholder='Rows' />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='rounded-md border overflow-x-auto'>
              <Table className='min-w-[700px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='min-w-[280px]'>Text</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slivers.map((sliver) => (
                    <TableRow key={sliver._id}>
                      <TableCell className='max-w-[320px] truncate font-medium'>
                        {sliver.text}
                      </TableCell>
                      <TableCell>{formatDate(sliver.createdAt)}</TableCell>
                      <TableCell>{formatDate(sliver.expiresAt)}</TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDelete(sliver._id)}
                          className='text-destructive'
                          disabled={deleteSliverMutation.isPending}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {slivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                        {isLoading ? 'Loading slivers...' : 'No slivers found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {pageCount}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
                  disabled={page >= pageCount || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Main>
  )
}
