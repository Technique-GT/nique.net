import { createFileRoute } from '@tanstack/react-router'
import Media from '@/features/articles/media-library/media-library'

export const Route = createFileRoute('/_authenticated/articles/media')({
  component: Media,
})
