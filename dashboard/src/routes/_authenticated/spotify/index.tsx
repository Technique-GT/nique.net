import { createFileRoute } from '@tanstack/react-router'
import Spotify from '@/features/analytics/spotify'

export const Route = createFileRoute('/_authenticated/spotify/')({
  component: Spotify,
})
