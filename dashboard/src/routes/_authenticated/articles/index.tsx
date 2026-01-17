import { createFileRoute } from '@tanstack/react-router'
import ArticleList from '@/features/articles/article-library/list'

export const Route = createFileRoute('/_authenticated/articles/')({
  component: ArticleList,
})

