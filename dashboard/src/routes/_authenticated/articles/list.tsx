import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/articles/list')({
  component: () => <Navigate to="/articles" replace />,
})
