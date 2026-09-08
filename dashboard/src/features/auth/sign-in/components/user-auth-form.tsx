import { API_BASE_URL } from '@/config';
import { HTMLAttributes, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className }: UserAuthFormProps) {
  const [devName, setDevName] = useState('');
  const [loading, setLoading] = useState(false);
  const checkAuth = useAuthStore((state) => state.auth.checkAuth);

  const handleDevLogin = async () => {
    if (!devName.trim()) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/dev-login', { name: devName.trim() });
      await checkAuth();
      // Navigate after auth refreshes — the ProtectedRoute will handle it
      window.location.href = '/';
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Dev login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button className="w-full" asChild>
        <a
          href={`${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(window.location.origin + '/dash')}`}
          className="inline-flex items-center gap-2"
        >
          <img
            src="/google-color.svg"
            alt=""
            className="h-4 w-4"
            aria-hidden="true"
          />
          <span>Continue with Google</span>
        </a>
      </Button>

      {import.meta.env.DEV && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Dev bypass
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="User name from DB"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
            />
            <Button
              variant="outline"
              onClick={handleDevLogin}
              disabled={loading || !devName.trim()}
            >
              {loading ? '...' : 'Login'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
