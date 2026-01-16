import { createFileRoute } from '@tanstack/react-router'
import Analysis from '@/features/maintenance/analytics'

export const Route = createFileRoute('/_authenticated/maintenance/')({
  component: Analysis,
})
