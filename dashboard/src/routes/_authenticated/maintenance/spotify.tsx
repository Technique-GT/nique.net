import { createFileRoute } from '@tanstack/react-router'
import Spotify from '@/features/maintenance/spotify'

export const Route = createFileRoute('/_authenticated/maintenance/spotify')({
  component: Spotify,
})
