import { create } from 'zustand';
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
        const user = await apiClient.get('/auth/me') as any;
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
      } catch (error: any) {
        // 401 is expected if not logged in
        set((state) => ({ 
          auth: { ...state.auth, user: null, isLoading: false } 
        }));
      }
    },

    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
        set((state) => ({ 
          auth: { ...state.auth, user: null } 
        }));
      } catch (error) {
        console.error('Logout failed', error);
      }
    },
  },
}));
