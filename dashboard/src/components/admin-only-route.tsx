import { useEffect } from 'react'
import { Navigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { canAccessAnalytics } from '@/lib/permissions'

interface AdminOnlyRouteProps {
  children: React.ReactNode
  fallback?: string
  message?: string
}

export function AdminOnlyRoute({
  children,
  fallback = '/dash',
  message = 'You do not have permission to view this page.',
}: AdminOnlyRouteProps) {
  const { user, isLoading } = useAuthStore((state) => state.auth)
  const isAdmin = canAccessAnalytics(user)

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast.error(message)
    }
  }, [isLoading, user, isAdmin, message])

  if (isLoading) return null
  if (!isAdmin) return <Navigate to={fallback} replace />
  return <>{children}</>
}
