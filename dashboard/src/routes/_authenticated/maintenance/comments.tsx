import { createFileRoute } from '@tanstack/react-router'
import Comments from '@/features/maintenance/comments'

export const Route = createFileRoute('/_authenticated/maintenance/comments')({
  component: Comments,
})
