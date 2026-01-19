import { createFileRoute } from '@tanstack/react-router'
import Slivers from '@/features/analytics/slivers'
import { AdminOnlyRoute } from '@/components/admin-only-route'

export const Route = createFileRoute('/_authenticated/slivers/')({
  component: () => (
    <AdminOnlyRoute>
      <Slivers />
    </AdminOnlyRoute>
  ),
})
