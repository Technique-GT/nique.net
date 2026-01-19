import { createFileRoute } from '@tanstack/react-router'
import Analysis from '@/features/analytics/analytics'
import { AdminOnlyRoute } from '@/components/admin-only-route'

export const Route = createFileRoute('/_authenticated/stats/')({
  component: () => (
    <AdminOnlyRoute>
      <Analysis />
    </AdminOnlyRoute>
  ),
})
