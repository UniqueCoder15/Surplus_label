import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, RegisterFormData, LoginFormData, AuthResponse } from '../types/auth';
import { getApiUrl } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalRolePreset?: 'donor' | 'recipient';
  authModalNotice?: string;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  openAuthModal: (mode?: 'login' | 'register', presetRole?: 'donor' | 'recipient', notice?: string) => void;
  closeAuthModal: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'surpluslabel_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRolePreset, setAuthModalRolePreset] = useState<'donor' | 'recipient' | undefined>(undefined);
  const [authModalNotice, setAuthModalNotice] = useState<string | undefined>(undefined);

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers || {});
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }

      const targetUrl = getApiUrl(url);

      const response = await fetch(targetUrl, {
        ...init,
        headers,
        credentials: 'include',
      });

      if (response.status === 401 && !url.includes('/api/auth/login')) {
        // Session expired or invalid
        setUser(null);
        setToken(null);
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      }

      return response;
    },
    [token]
  );

  // Check initial session
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const headers: Record<string, string> = {};
        if (savedToken) {
          headers['Authorization'] = `Bearer ${savedToken}`;
        }

        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
          }
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const json: AuthResponse = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Failed to sign in.' };
      }

      if (json.user && json.token) {
        setUser(json.user);
        setToken(json.token);
        try {
          localStorage.setItem(TOKEN_KEY, json.token);
        } catch {}
        setIsAuthModalOpen(false);
        return { success: true };
      }

      return { success: false, error: 'Unexpected response from server.' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Network error signing in.' };
    }
  };

  const register = async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const json: AuthResponse = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Registration failed.' };
      }

      if (json.user && json.token) {
        setUser(json.user);
        setToken(json.token);
        try {
          localStorage.setItem(TOKEN_KEY, json.token);
        } catch {}
        setIsAuthModalOpen(false);
        return { success: true };
      }

      return { success: false, error: 'Unexpected response from server.' };
    } catch (err: any) {
      console.error('Registration error:', err);
      return { success: false, error: err.message || 'Network error registering account.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {}
    }
  };

  const quickDemoLogin = async (role: UserRole): Promise<{ success: boolean; error?: string }> => {
    const credentialsMap: Record<UserRole, LoginFormData> = {
      donor: { email: 'donor@greenmarket.org', password: 'DemoPass123!' },
      recipient: { email: 'rescue@foodpantry.org', password: 'DemoPass123!' },
      admin: { email: 'admin@surpluslabel.org', password: 'DemoPass123!' },
    };

    return login(credentialsMap[role]);
  };

  const openAuthModal = (
    mode: 'login' | 'register' = 'login',
    presetRole?: 'donor' | 'recipient',
    notice?: string
  ) => {
    setAuthModalMode(mode);
    setAuthModalRolePreset(presetRole);
    setAuthModalNotice(notice);
    setIsAuthModalOpen(true);
    window.location.hash = '#/auth';
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalNotice(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        authModalRolePreset,
        authModalNotice,
        login,
        register,
        logout,
        quickDemoLogin,
        openAuthModal,
        closeAuthModal,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
