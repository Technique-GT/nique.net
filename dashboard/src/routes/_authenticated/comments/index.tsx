import { createFileRoute } from '@tanstack/react-router'
import { AdminOnlyRoute } from '@/components/admin-only-route'
import Comments from '@/features/stats-moderation/comments'

export const Route = createFileRoute('/_authenticated/comments/')({
  component: () => (
    <AdminOnlyRoute>
      <Comments />
    </AdminOnlyRoute>
  ),
})
