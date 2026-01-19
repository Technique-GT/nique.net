import { createFileRoute } from '@tanstack/react-router'
import ArticleCreation from '@/features/articles/article-creation/article-creation'

export const Route = createFileRoute('/_authenticated/articles/$articleId/edit' as any)({
  component: ArticleCreation,
})
