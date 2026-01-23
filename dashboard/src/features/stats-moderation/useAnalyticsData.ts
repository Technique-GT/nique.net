import { useQuery } from '@tanstack/react-query'
import { getAdminArticlesAll } from '@/services/articles'
import { getCommentStats } from '@/services/comments'

export type AnalyticsData = {
  topArticles: { title: string; views: number; comments: number }[]
  viewsByCategory: { name: string; value: number; color: string }[]
  publishingTrend: { date: string; articles: number }[]
  commentStats: { approved: number; pending: number }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658']

export function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      const [articles, stats] = await Promise.all([
        getAdminArticlesAll({ limitPerPage: 100, maxPages: 20 }),
        getCommentStats(),
      ])

      // Top Articles
      const topArticles = articles
        .slice()
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10)
        .map(a => ({
          title: a.title,
          views: a.viewCount || 0,
          comments: 0, // Backend doesn't give comment count per article in list yet
        }))

      // Views by Category
      const viewsByCatMap = new Map<string, number>()
      articles.forEach(a => {
        const catName = (typeof a.categoryId === 'object' && a.categoryId?.name) || 'Uncategorized'
        const views = a.viewCount || 0
        viewsByCatMap.set(catName, (viewsByCatMap.get(catName) || 0) + views)
      })
      const viewsByCategory = Array.from(viewsByCatMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)

      // Publishing Trend (Last 6 months)
      const now = new Date()
      const trend: { date: string; articles: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = d.toLocaleString('default', { month: 'short' })
        const count = articles.filter(a => {
          if (!a.publishedAt) return false
          const pDate = new Date(a.publishedAt)
          return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear()
        }).length
        trend.push({ date: monthName, articles: count })
      }

      return {
        topArticles,
        viewsByCategory,
        publishingTrend: trend,
        commentStats: {
          approved: stats.approvedComments,
          pending: stats.pendingComments
        }
      }
    },
    staleTime: 60 * 1000,
  })
}
