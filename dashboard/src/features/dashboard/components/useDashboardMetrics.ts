import { useQuery } from '@tanstack/react-query'
import { getAdminArticlesAll, type BackendArticle } from '@/services/articles'
import { getCommentStats } from '@/services/comments'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addMonths(date: Date, delta: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + delta)
  return d
}

function formatMonthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'short' })
}

export type DashboardKpis = {
  publishedLast30d: number
  drafts: number
  totalViews: number
  pendingComments: number
}

export type PublishedByMonthPoint = {
  name: string
  total: number
}

export type RecentArticle = {
  id: string
  title: string
  categoryName: string
  viewCount: number
  publishedAt: string | null
}

function getCategoryName(article: BackendArticle): string {
  const c = article.categoryId
  if (!c) return 'Uncategorized'
  if (typeof c === 'string') return 'Uncategorized'
  return c.name || 'Uncategorized'
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const [articles, stats] = await Promise.all([
        getAdminArticlesAll({ limitPerPage: 100, maxPages: 20 }),
        getCommentStats(),
      ])

      const now = new Date()
      const since30 = new Date(now)
      since30.setDate(since30.getDate() - 30)

      const published = articles.filter((a) => a.published)
      const drafts = articles.filter((a) => !a.published)

      const publishedLast30d = published.filter((a) => {
        if (!a.publishedAt) return false
        const t = Date.parse(a.publishedAt)
        if (Number.isNaN(t)) return false
        return t >= since30.getTime()
      }).length

      const totalViews = articles.reduce((sum, a) => sum + (typeof a.viewCount === 'number' ? a.viewCount : 0), 0)

      // Last 12 months bucket (including current month)
      const start = startOfDay(addMonths(now, -11))
      start.setDate(1)
      const monthStarts: Date[] = []
      for (let i = 0; i < 12; i++) {
        const m = addMonths(start, i)
        m.setDate(1)
        m.setHours(0, 0, 0, 0)
        monthStarts.push(m)
      }

      const publishedByMonth: PublishedByMonthPoint[] = monthStarts.map((mStart, idx) => {
        const next = idx < monthStarts.length - 1 ? monthStarts[idx + 1] : addMonths(mStart, 1)
        const total = published.filter((a) => {
          if (!a.publishedAt) return false
          const t = Date.parse(a.publishedAt)
          if (Number.isNaN(t)) return false
          return t >= mStart.getTime() && t < next.getTime()
        }).length

        return { name: formatMonthLabel(mStart), total }
      })

      const recentArticles: RecentArticle[] = published
        .filter((a) => a.publishedAt)
        .slice()
        .sort((a, b) => Date.parse(b.publishedAt || '') - Date.parse(a.publishedAt || ''))
        .slice(0, 5)
        .map((a) => ({
          id: a._id,
          title: a.title,
          categoryName: getCategoryName(a),
          viewCount: typeof a.viewCount === 'number' ? a.viewCount : 0,
          publishedAt: a.publishedAt,
        }))

      const kpis: DashboardKpis = {
        publishedLast30d,
        drafts: drafts.length,
        totalViews,
        pendingComments: stats.pendingComments,
      }

      return { kpis, publishedByMonth, recentArticles }
    },
    staleTime: 30 * 1000,
  })
}
