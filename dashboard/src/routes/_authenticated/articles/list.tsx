import { createFileRoute } from '@tanstack/react-router'
import List from '@/features/articles/article-libary/list'

export const Route = createFileRoute('/_authenticated/articles/list')({
  component: List,
})
