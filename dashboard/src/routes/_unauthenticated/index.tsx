import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_unauthenticated/')({
  component: () => <Navigate to="/login" replace />,
})
