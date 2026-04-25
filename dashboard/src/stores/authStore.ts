import { create } from 'zustand';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  name: string;
  email?: string; // Backend might not expose email if not in schema, but googleSub implies it might be there implicitly or we just don't have it.
  role: string[]; // Frontend expects roles array
  isAdmin: boolean;
  avatar?: string;
}

interface AuthState {
  auth: {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: AuthUser | null) => void;
  };
}

type BackendAuthUser = {
  _id: string;
  name: string;
  email?: string;
  isAdmin: boolean;
  profilePictureUrl?: string;
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    isLoading: true, // Start loading by default
    error: null,

    setUser: (user) =>
      set((state) => ({ auth: { ...state.auth, user } })),

    checkAuth: async () => {
      set((state) => ({ auth: { ...state.auth, isLoading: true, error: null } }));
      try {
        const user = await apiClient.get('/auth/me') as unknown as BackendAuthUser;
        // Transform backend user to frontend shape
        const mappedUser: AuthUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          role: user.isAdmin ? ['admin', 'superadmin'] : ['user'], // Map boolean to roles
          avatar: user.profilePictureUrl,
        };
        
        set((state) => ({ 
          auth: { ...state.auth, user: mappedUser, isLoading: false } 
        }));
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          const status = error.response?.status ?? 0;

          // Only clear the session when auth is truly invalid.
          if (status === 401 || status === 403) {
            set((state) => ({
              auth: { ...state.auth, user: null, isLoading: false }
            }));
            return;
          }
        }

        // Transient failures (network/429/5xx) should not force logout.
        set((state) => ({
          auth: {
            ...state.auth,
            isLoading: false,
            error: 'Unable to refresh session. Please try again.',
          }
        }));
      }
    },

    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
        set((state) => ({ 
          auth: { ...state.auth, user: null } 
        }));
      } catch (_error) {
        // noop
      }
    },
  },
}));
