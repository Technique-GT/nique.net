import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Hardcoded user for demo purposes
const DEMO_USER = {
  id: '1',
  firstName: 'Admin',
  lastName: 'User',
  username: 'admin',
  email: 'admin@example.com',
  phoneNumber: '',
  role: 'admin',
  status: 'active',
};

// Hardcoded credentials - in a real app, this would be an API call
const VALID_CREDENTIALS = [
  {
    email: 'admin@example.com',
    password: 'admin123', // In a real app, never hardcode passwords!
    user: DEMO_USER
  }
];

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth storage key for localStorage
const AUTH_KEY = 'technique_dash_auth';
// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on initial load
  useEffect(() => {
    checkAuth();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    try {
      // Simple credential check
      const validCredential = VALID_CREDENTIALS.find(
        cred => cred.email === data.email && cred.password === data.password
      );

      if (validCredential) {
        const authData = {
          user: validCredential.user,
          timestamp: Date.now(),
          isAuthenticated: true
        };
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        setUser(validCredential.user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        message: 'Invalid email or password' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'An error occurred during login' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to login page
    window.location.href = '/login';
  }, []);

  const checkAuth = useCallback(() => {
    setIsLoading(true);
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const { user, timestamp, isAuthenticated } = authData;
        
        // Check if the session is still valid
        const isSessionValid = Date.now() - timestamp < SESSION_TIMEOUT;
        
        if (isSessionValid && isAuthenticated) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          // Session expired or invalid
          localStorage.removeItem(AUTH_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No auth data found
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid auth data
      localStorage.removeItem(AUTH_KEY);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}