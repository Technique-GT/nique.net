import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ProtectedRoute } from '@/components/protected-route'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayoutWrapper,
})

function AuthenticatedLayoutWrapper() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout />
    </ProtectedRoute>
  )
}