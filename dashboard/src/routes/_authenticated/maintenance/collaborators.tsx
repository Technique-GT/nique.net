import { createFileRoute } from '@tanstack/react-router'
import Chats from '@/features/maintenance/collaborators'

export const Route = createFileRoute('/_authenticated/maintenance/collaborators')({
  component: Chats,
})
