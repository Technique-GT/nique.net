import { createFileRoute } from '@tanstack/react-router'
import Articles from '@/features/articles/article-creation/article-creation'

export const Route = createFileRoute('/_authenticated/articles/')({
  component: Articles,
})

