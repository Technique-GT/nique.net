import { useAuthStore } from '@/stores/authStore';
import { Navigate, useLocation } from '@tanstack/react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export function ProtectedRoute({ children, fallback = '/login' }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');

    if (location.pathname.startsWith('/login')) {
      return <>{children}</>;
    }
    
    return <Navigate 
      to={fallback} 
      search={{ 
        redirect: location.pathname,
        ...(error ? { error } : {})
      }} 
      replace 
    />;
  }

  return <>{children}</>;
}
