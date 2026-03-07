import { createFileRoute } from '@tanstack/react-router'
import Slivers from '@/features/stats-moderation/slivers'
import { AdminOnlyRoute } from '@/components/admin-only-route'

export const Route = createFileRoute('/_authenticated/slivers/')({
  component: () => (
    <AdminOnlyRoute>
      <Slivers />
    </AdminOnlyRoute>
  ),
})
