import { createFileRoute } from '@tanstack/react-router'
import MediaLibrary from '@/features/articles/media-library/media-library'

export const Route = createFileRoute('/_authenticated/articles/media')({
  component: MediaLibrary,
})
