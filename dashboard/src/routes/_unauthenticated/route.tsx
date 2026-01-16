import { createFileRoute, Navigate } from '@tanstack/react-router'
import SignIn2 from '@/features/auth/sign-in/sign-in-2'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_unauthenticated')({
  component: UnauthenticatedLayout,
})

function UnauthenticatedLayout() {
  const { user, accessToken } = useAuthStore((state) => state.auth);
  
  const isAuthenticated = !!(user && accessToken);

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dash" replace />
  }

  // If not authenticated, show the login page
  return <SignIn2 />
}