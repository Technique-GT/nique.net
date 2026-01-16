import { useAuthStore } from '@/stores/authStore';
import { Navigate, useLocation } from '@tanstack/react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export function ProtectedRoute({ children, fallback = '/login' }: ProtectedRouteProps) {
  const { user, accessToken } = useAuthStore((state) => state.auth);
  const location = useLocation();

  const isAuthenticated = !!(user && accessToken);

  // For demo purposes - you can remove this loading state if not needed
  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  //     </div>
  //   );
  // }

  if (!isAuthenticated) {
    return <Navigate to={fallback} search={{ redirect: location.pathname }} replace />;
  }

  return <>{children}</>;
}