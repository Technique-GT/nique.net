import { createFileRoute } from '@tanstack/react-router'
import Analysis from '@/features/analytics/analytics'

export const Route = createFileRoute('/_authenticated/stats/')({
  component: Analysis,
})
