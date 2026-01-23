import { createFileRoute } from '@tanstack/react-router'
import Comments from '@/features/stats-moderation/comments'
import { AdminOnlyRoute } from '@/components/admin-only-route'

export const Route = createFileRoute('/_authenticated/comments/')({
  component: () => (
    <AdminOnlyRoute>
      <Comments />
    </AdminOnlyRoute>
  ),
})
