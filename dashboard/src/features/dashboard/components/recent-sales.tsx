import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useDashboardMetrics } from './useDashboardMetrics'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function RecentSales() {
  const { data, isLoading, isError } = useDashboardMetrics()

  if (isLoading) {
    return <div className='text-muted-foreground py-6 text-sm'>Loading recent articles…</div>
  }

  if (isError || !data) {
    return <div className='text-muted-foreground py-6 text-sm'>Failed to load recent articles.</div>
  }

  if (data.recentArticles.length === 0) {
    return <div className='text-muted-foreground py-6 text-sm'>No published articles yet.</div>
  }

  return (
    <div className='space-y-8'>
      {data.recentArticles.map((a) => (
        <div key={a.id} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{a.categoryName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{a.title}</p>
              <p className='text-muted-foreground text-sm'>
                {a.categoryName} • {a.viewCount.toLocaleString('en-US')} views • {formatDate(a.publishedAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
