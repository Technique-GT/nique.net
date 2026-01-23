import { createFileRoute } from '@tanstack/react-router'
import Spotify from '@/features/stats-moderation/spotify'
import { AdminOnlyRoute } from '@/components/admin-only-route'

export const Route = createFileRoute('/_authenticated/spotify/')({
  component: () => (
    <AdminOnlyRoute>
      <Spotify />
    </AdminOnlyRoute>
  ),
})
