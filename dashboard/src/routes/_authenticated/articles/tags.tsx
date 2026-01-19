import { createFileRoute } from '@tanstack/react-router'
import Tags from '@/features/articles/tags/tags'

export const Route = createFileRoute('/_authenticated/articles/tags')({
  component: Tags,
})
