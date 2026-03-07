import { createFileRoute } from '@tanstack/react-router'
import Documentation from '@/features/documentation'

export const Route = createFileRoute('/_authenticated/documentation/')({
  component: Documentation,
})
