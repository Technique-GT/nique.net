import { createFileRoute } from '@tanstack/react-router'
import Comments from '@/features/analytics/comments'

export const Route = createFileRoute('/_authenticated/comments/')({
  component: Comments,
})
